import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { createMockTransactionsDashboardActions } from "@/modules/transactions-dashboard/commands/transactions-dashboard-actions"
import { listMockTransactions } from "@/modules/transactions-dashboard/model/transaction/mock-transactions"
import {
  TRANSACTION_STATUS,
  type Transaction,
} from "@/modules/transactions-dashboard/model/transaction/transaction"
import { TransactionsDashboardClient } from "./TransactionsDashboardClient"

function renderDashboard(ui: React.ReactElement) {
  return render(ui)
}

function getSelectedSummaryCard(): HTMLElement {
  return screen.getByText("Selected").closest('[data-slot="card"]') as HTMLElement
}

function getSortButton(label: "Amount" | "Date and time" | "Status"): HTMLElement {
  return screen.getByRole("button", { name: `Sort by ${label.toLowerCase()}` })
}

function getVisibleTransactionIds(): string[] {
  return screen.getAllByRole("row").slice(1).map((row) => {
    const transactionId = within(row).getByText(/^TXN-/).textContent

    if (!transactionId) {
      throw new Error("Expected transaction id text in payment history row")
    }

    return transactionId
  })
}

function getExpectedTransactionIds(
  transactions: readonly Transaction[],
  compare: (left: Transaction, right: Transaction) => number
): string[] {
  return transactions
    .map((transaction, index) => ({ index, transaction }))
    .sort(
      (left, right) =>
        compare(left.transaction, right.transaction) || left.index - right.index
    )
    .map(({ transaction }) => transaction.id)
}

describe("TransactionsDashboard sorting", () => {
  it.each([
    {
      label: "Amount" as const,
      getExpectedAscIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) => left.amountCents - right.amountCents
        ),
      getExpectedDescIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) => right.amountCents - left.amountCents
        ),
    },
    {
      label: "Date and time" as const,
      getExpectedAscIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) =>
            Date.parse(left.occurredAt) - Date.parse(right.occurredAt)
        ),
      getExpectedDescIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) =>
            Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
        ),
    },
    {
      label: "Status" as const,
      getExpectedAscIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) =>
            Number(left.status === TRANSACTION_STATUS.SUCCESS) -
            Number(right.status === TRANSACTION_STATUS.SUCCESS)
        ),
      getExpectedDescIds: (transactions: readonly Transaction[]) =>
        getExpectedTransactionIds(
          transactions,
          (left, right) =>
            Number(right.status === TRANSACTION_STATUS.SUCCESS) -
            Number(left.status === TRANSACTION_STATUS.SUCCESS)
        ),
    },
  ])(
    "cycles $label sorting from descending to ascending to default",
    async ({ label, getExpectedAscIds, getExpectedDescIds }) => {
      const user = userEvent.setup()
      const initialTransactions = listMockTransactions()
      const sortButton = () => getSortButton(label)

      renderDashboard(
        <TransactionsDashboardClient initialTransactions={initialTransactions} />
      )

      await user.click(sortButton())

      expect(sortButton().closest("th")).toHaveAttribute("aria-sort", "descending")
      expect(getVisibleTransactionIds()).toEqual(
        getExpectedDescIds(initialTransactions)
      )

      await user.click(sortButton())

      expect(sortButton().closest("th")).toHaveAttribute("aria-sort", "ascending")
      expect(getVisibleTransactionIds()).toEqual(
        getExpectedAscIds(initialTransactions)
      )

      await user.click(sortButton())

      expect(sortButton().closest("th")).toHaveAttribute("aria-sort", "none")
      expect(getVisibleTransactionIds()).toEqual(
        initialTransactions.map((transaction) => transaction.id)
      )
    }
  )

  it("starts a newly selected sort column in descending and clears the previous active sort", async () => {
    const user = userEvent.setup()

    renderDashboard(
      <TransactionsDashboardClient initialTransactions={listMockTransactions()} />
    )

    await user.click(getSortButton("Amount"))

    expect(getSortButton("Amount").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    )

    await user.click(getSortButton("Status"))

    expect(getSortButton("Status").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    )
    expect(getSortButton("Amount").closest("th")).toHaveAttribute(
      "aria-sort",
      "none"
    )
  })

  it("keeps failed-row selection connected to transaction ids after sorting", async () => {
    const user = userEvent.setup()

    renderDashboard(
      <TransactionsDashboardClient initialTransactions={listMockTransactions()} />
    )

    await user.click(getSortButton("Amount"))
    await user.click(getSortButton("Amount"))
    await user.click(
      screen.getByRole("checkbox", {
        name: /select failed transaction TXN-2025-0034/i,
      })
    )

    expect(
      screen.getByRole("button", { name: /retry selected/i })
    ).toBeEnabled()
    expect(within(getSelectedSummaryCard()).getByText("1")).toBeVisible()
    expect(
      screen.getByRole("checkbox", {
        name: /select failed transaction TXN-2025-0034/i,
      })
    ).toBeChecked()
  })

  it("preserves the active sort mode and reapplies it to reset transaction data", async () => {
    const user = userEvent.setup()
    const initialTransactions = listMockTransactions()
    const retryPayment = vi.fn(async () => ({
      status: TRANSACTION_STATUS.SUCCESS,
      transactionId: "TXN-2026-0041",
    }))

    renderDashboard(
      <TransactionsDashboardClient
        initialTransactions={initialTransactions}
        actions={createMockTransactionsDashboardActions({ retryPayment })}
      />
    )

    await user.click(getSortButton("Status"))
    await user.click(
      screen.getByRole("checkbox", {
        name: /select failed transaction TXN-2026-0041/i,
      })
    )
    await user.click(screen.getByRole("button", { name: /retry selected/i }))

    await waitFor(() => {
      expect(getVisibleTransactionIds().slice(0, 4)).toEqual([
        "TXN-2026-0042",
        "TXN-2026-0041",
        "TXN-2026-0038",
        "TXN-2025-0035",
      ])
    })

    await user.click(screen.getByRole("button", { name: /reset/i }))

    expect(getSortButton("Status").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    )
    expect(getVisibleTransactionIds()).toEqual(
      getExpectedTransactionIds(
        initialTransactions,
        (left, right) =>
          Number(right.status === TRANSACTION_STATUS.SUCCESS) -
          Number(left.status === TRANSACTION_STATUS.SUCCESS)
      )
    )
  })
})

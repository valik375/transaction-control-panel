import { describe, expect, it } from "vitest"

import {
  createDashboardState,
  getFailedSelectionState,
  getRetryEligibleFailedTransactionIds,
  getRetryableSelectedIds,
  getTransactionsSummary,
  transactionsDashboardReducer,
} from "./dashboard-state"
import { listMockTransactions } from "@/modules/transactions-dashboard/model/transaction/mock-transactions"
import { TRANSACTION_STATUS } from "@/modules/transactions-dashboard/model/transaction/transaction"

describe("transactionsDashboardReducer", () => {
  it("selects only failed transactions that are not retrying", () => {
    const state = createDashboardState(listMockTransactions())

    const withSuccessfulToggle = transactionsDashboardReducer(state, {
      transactionId: "TXN-2026-0042",
      type: "selection/toggled",
    })

    expect(withSuccessfulToggle.selectedIds).toEqual([])

    const withFailedToggle = transactionsDashboardReducer(state, {
      transactionId: "TXN-2026-0039",
      type: "selection/toggled",
    })

    expect(withFailedToggle.selectedIds).toEqual(["TXN-2026-0039"])
    expect(getRetryableSelectedIds(withFailedToggle)).toEqual(["TXN-2026-0039"])
  })

  it("clears selected rows when a retry batch starts", () => {
    const selectedState = transactionsDashboardReducer(
      createDashboardState(listMockTransactions()),
      {
        transactionId: "TXN-2026-0039",
        type: "selection/toggled",
      }
    )

    const retryingState = transactionsDashboardReducer(selectedState, {
      transactionIds: ["TXN-2026-0039"],
      type: "retry/started",
    })

    expect(retryingState.selectedIds).toEqual([])
    expect(retryingState.retryingIds).toEqual(["TXN-2026-0039"])
  })

  it("bulk header selection selects all failed, non-retrying transactions", () => {
    const state = transactionsDashboardReducer(
      createDashboardState(listMockTransactions()),
      {
        transactionIds: ["TXN-2026-0039", "TXN-2025-0036"],
        type: "retry/started",
      }
    )

    const nextState = transactionsDashboardReducer(state, {
      type: "selection/all-failed-toggled",
    })

    expect(nextState.selectedIds).toEqual(
      getRetryEligibleFailedTransactionIds(state)
    )
    expect(getRetryableSelectedIds(nextState)).toEqual(nextState.selectedIds)
    expect(getFailedSelectionState(nextState)).toEqual({
      allEligibleFailedTransactionsSelected: true,
      hasEligibleFailedTransactions: true,
      someEligibleFailedTransactionsSelected: false,
    })
  })

  it("bulk header toggle clears selection when all eligible failed rows are already selected", () => {
    const withAllSelected = transactionsDashboardReducer(
      createDashboardState(listMockTransactions()),
      {
        type: "selection/all-failed-toggled",
      }
    )

    const clearedState = transactionsDashboardReducer(withAllSelected, {
      type: "selection/all-failed-toggled",
    })

    expect(clearedState.selectedIds).toEqual([])
    expect(getFailedSelectionState(clearedState)).toEqual({
      allEligibleFailedTransactionsSelected: false,
      hasEligibleFailedTransactions: true,
      someEligibleFailedTransactionsSelected: false,
    })
  })

  it("successful rows are never included", () => {
    const state = createDashboardState(listMockTransactions())

    const nextState = transactionsDashboardReducer(state, {
      type: "selection/all-failed-toggled",
    })

    expect(nextState.selectedIds).not.toContain("TXN-2026-0042")
    expect(nextState.selectedIds).not.toContain("TXN-2026-0038")
    expect(nextState.selectedIds).not.toContain("TXN-2025-0035")
  })

  it("retrying rows are never included", () => {
    const retryingState = transactionsDashboardReducer(
      createDashboardState(listMockTransactions()),
      {
        transactionIds: ["TXN-2026-0039", "TXN-2025-0036"],
        type: "retry/started",
      }
    )

    const nextState = transactionsDashboardReducer(retryingState, {
      type: "selection/all-failed-toggled",
    })

    expect(nextState.selectedIds).not.toContain("TXN-2026-0039")
    expect(nextState.selectedIds).not.toContain("TXN-2025-0036")
    expect(getRetryEligibleFailedTransactionIds(nextState)).not.toContain(
      "TXN-2026-0039"
    )
    expect(getRetryEligibleFailedTransactionIds(nextState)).not.toContain(
      "TXN-2025-0036"
    )
  })

  it("updates each retried row independently when results resolve", () => {
    const retryingState = transactionsDashboardReducer(
      createDashboardState(listMockTransactions()),
      {
        transactionIds: ["TXN-2026-0039", "TXN-2025-0036"],
        type: "retry/started",
      }
    )

    const firstResolvedState = transactionsDashboardReducer(retryingState, {
      result: {
        status: TRANSACTION_STATUS.SUCCESS,
        transactionId: "TXN-2026-0039",
      },
      type: "retry/resolved",
    })

    expect(firstResolvedState.retryingIds).toEqual(["TXN-2025-0036"])
    expect(
      firstResolvedState.transactions.find(
        (transaction) => transaction.id === "TXN-2026-0039"
      )?.status
    ).toBe(TRANSACTION_STATUS.SUCCESS)
    expect(
      firstResolvedState.transactions.find(
        (transaction) => transaction.id === "TXN-2025-0036"
      )?.status
    ).toBe(TRANSACTION_STATUS.FAILED)

    const secondResolvedState = transactionsDashboardReducer(
      firstResolvedState,
      {
        result: {
          status: TRANSACTION_STATUS.FAILED,
          transactionId: "TXN-2025-0036",
        },
        type: "retry/resolved",
      }
    )

    expect(secondResolvedState.retryingIds).toEqual([])
    expect(
      secondResolvedState.transactions.find(
        (transaction) => transaction.id === "TXN-2025-0036"
      )?.status
    ).toBe(TRANSACTION_STATUS.FAILED)
  })

  it("summarizes successful billing separately from failed rows", () => {
    const summary = getTransactionsSummary(listMockTransactions())

    expect(summary.successfulCount).toBe(3)
    expect(summary.failedCount).toBe(7)
    expect(summary.totalCents).toBe(5_997)
  })
})

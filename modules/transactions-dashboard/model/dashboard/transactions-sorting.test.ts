import { describe, expect, it } from "vitest"

import { listMockTransactions } from "@/modules/transactions-dashboard/model/transaction/mock-transactions"
import {
  TRANSACTIONS_SORT_COLUMN,
  TRANSACTIONS_SORT_DIRECTION,
  sortTransactions,
  toggleTransactionsSort,
  type TransactionsSort,
} from "./transactions-sorting"

function getTransactionIds(transactions: readonly { id: string }[]): string[] {
  return transactions.map((transaction) => transaction.id)
}

describe("toggleTransactionsSort", () => {
  it("cycles from descending to ascending to default for the same column", () => {
    const descSort = toggleTransactionsSort(
      null,
      TRANSACTIONS_SORT_COLUMN.AMOUNT
    )

    expect(descSort).toEqual({
      column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
      direction: TRANSACTIONS_SORT_DIRECTION.DESC,
    })

    const ascSort = toggleTransactionsSort(
      descSort,
      TRANSACTIONS_SORT_COLUMN.AMOUNT
    )

    expect(ascSort).toEqual({
      column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
      direction: TRANSACTIONS_SORT_DIRECTION.ASC,
    })

    expect(
      toggleTransactionsSort(ascSort, TRANSACTIONS_SORT_COLUMN.AMOUNT)
    ).toBeNull()
  })

  it("starts a different sortable column in descending mode", () => {
    const currentSort: TransactionsSort = {
      column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
      direction: TRANSACTIONS_SORT_DIRECTION.ASC,
    }

    expect(
      toggleTransactionsSort(currentSort, TRANSACTIONS_SORT_COLUMN.STATUS)
    ).toEqual({
      column: TRANSACTIONS_SORT_COLUMN.STATUS,
      direction: TRANSACTIONS_SORT_DIRECTION.DESC,
    })
  })
})

describe("sortTransactions", () => {
  it("returns the original order unchanged for the default mode", () => {
    const transactions = listMockTransactions()

    expect(sortTransactions(transactions, null)).toBe(transactions)
  })

  it("sorts amount descending and ascending without mutating the source", () => {
    const transactions = listMockTransactions()
    const originalOrder = getTransactionIds(transactions)

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
          direction: TRANSACTIONS_SORT_DIRECTION.DESC,
        })
      )
    ).toEqual([
      "TXN-2026-0042",
      "TXN-2026-0041",
      "TXN-2026-0039",
      "TXN-2026-0038",
      "TXN-2026-0037",
      "TXN-2025-0036",
      "TXN-2025-0035",
      "TXN-2025-0034",
      "TXN-2025-0033",
      "TXN-2026-0040",
    ])

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
          direction: TRANSACTIONS_SORT_DIRECTION.ASC,
        })
      )
    ).toEqual([
      "TXN-2026-0040",
      "TXN-2025-0034",
      "TXN-2025-0033",
      "TXN-2026-0042",
      "TXN-2026-0041",
      "TXN-2026-0039",
      "TXN-2026-0038",
      "TXN-2026-0037",
      "TXN-2025-0036",
      "TXN-2025-0035",
    ])

    expect(getTransactionIds(transactions)).toEqual(originalOrder)
  })

  it("sorts date and time descending and ascending", () => {
    const transactions = listMockTransactions()

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.OCCURRED_AT,
          direction: TRANSACTIONS_SORT_DIRECTION.DESC,
        })
      )
    ).toEqual(getTransactionIds(transactions))

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.OCCURRED_AT,
          direction: TRANSACTIONS_SORT_DIRECTION.ASC,
        })
      )
    ).toEqual([
      "TXN-2025-0033",
      "TXN-2025-0034",
      "TXN-2025-0035",
      "TXN-2025-0036",
      "TXN-2026-0037",
      "TXN-2026-0038",
      "TXN-2026-0039",
      "TXN-2026-0040",
      "TXN-2026-0041",
      "TXN-2026-0042",
    ])
  })

  it("sorts status with success before failed in descending mode", () => {
    const transactions = listMockTransactions()

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.STATUS,
          direction: TRANSACTIONS_SORT_DIRECTION.DESC,
        })
      )
    ).toEqual([
      "TXN-2026-0042",
      "TXN-2026-0038",
      "TXN-2025-0035",
      "TXN-2026-0041",
      "TXN-2026-0040",
      "TXN-2026-0039",
      "TXN-2026-0037",
      "TXN-2025-0036",
      "TXN-2025-0034",
      "TXN-2025-0033",
    ])
  })

  it("keeps equal sortable values in their incoming order", () => {
    const transactions = listMockTransactions().filter(
      (transaction) => transaction.amountCents === 1_999
    )

    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
          direction: TRANSACTIONS_SORT_DIRECTION.DESC,
        })
      )
    ).toEqual(getTransactionIds(transactions))
    expect(
      getTransactionIds(
        sortTransactions(transactions, {
          column: TRANSACTIONS_SORT_COLUMN.AMOUNT,
          direction: TRANSACTIONS_SORT_DIRECTION.ASC,
        })
      )
    ).toEqual(getTransactionIds(transactions))
  })
})

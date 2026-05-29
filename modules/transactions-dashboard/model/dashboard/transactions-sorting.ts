import {
  TRANSACTION_STATUS,
  type Transaction,
} from "@/modules/transactions-dashboard/model/transaction/transaction"

export const TRANSACTIONS_SORT_COLUMN = {
  AMOUNT: "amount",
  OCCURRED_AT: "occurredAt",
  STATUS: "status",
} as const

export type TransactionsSortColumn =
  (typeof TRANSACTIONS_SORT_COLUMN)[keyof typeof TRANSACTIONS_SORT_COLUMN]

export const TRANSACTIONS_SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
} as const

export type TransactionsSortDirection =
  (typeof TRANSACTIONS_SORT_DIRECTION)[keyof typeof TRANSACTIONS_SORT_DIRECTION]

export interface TransactionsSort {
  readonly column: TransactionsSortColumn
  readonly direction: TransactionsSortDirection
}

export function toggleTransactionsSort(
  currentSort: TransactionsSort | null,
  column: TransactionsSortColumn
): TransactionsSort | null {
  if (!currentSort || currentSort.column !== column) {
    return {
      column,
      direction: TRANSACTIONS_SORT_DIRECTION.DESC,
    }
  }

  if (currentSort.direction === TRANSACTIONS_SORT_DIRECTION.DESC) {
    return {
      column,
      direction: TRANSACTIONS_SORT_DIRECTION.ASC,
    }
  }

  return null
}

export function sortTransactions(
  transactions: readonly Transaction[],
  sort: TransactionsSort | null
): readonly Transaction[] {
  if (!sort) {
    return transactions
  }

  return transactions
    .map((transaction, index) => ({ index, transaction }))
    .sort((left, right) => {
      const result = compareTransactions(left.transaction, right.transaction, sort)

      return result !== 0 ? result : left.index - right.index
    })
    .map(({ transaction }) => transaction)
}

function compareTransactions(
  left: Transaction,
  right: Transaction,
  sort: TransactionsSort
): number {
  switch (sort.column) {
    case TRANSACTIONS_SORT_COLUMN.AMOUNT:
      return compareComparableValues(
        left.amountCents,
        right.amountCents,
        sort.direction
      )
    case TRANSACTIONS_SORT_COLUMN.OCCURRED_AT:
      return compareComparableValues(
        Date.parse(left.occurredAt),
        Date.parse(right.occurredAt),
        sort.direction
      )
    case TRANSACTIONS_SORT_COLUMN.STATUS:
      return compareComparableValues(
        getStatusRank(left.status),
        getStatusRank(right.status),
        sort.direction
      )
    default: {
      const exhaustiveColumn: never = sort.column

      return exhaustiveColumn
    }
  }
}

function compareComparableValues(
  left: number,
  right: number,
  direction: TransactionsSortDirection
): number {
  return direction === TRANSACTIONS_SORT_DIRECTION.DESC
    ? right - left
    : left - right
}

function getStatusRank(status: Transaction["status"]): number {
  return status === TRANSACTION_STATUS.SUCCESS ? 1 : 0
}

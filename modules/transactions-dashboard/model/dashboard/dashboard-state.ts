import {
  TRANSACTION_STATUS,
  type RetryPaymentResult,
  type Transaction,
} from "@/modules/transactions-dashboard/model/transaction/transaction"

export interface TransactionsDashboardState {
  readonly transactions: readonly Transaction[]
  readonly selectedIds: readonly string[]
  readonly retryingIds: readonly string[]
}

export type TransactionsDashboardAction =
  | {
      readonly type: "state/reset"
      readonly transactions: readonly Transaction[]
    }
  | { readonly type: "selection/toggled"; readonly transactionId: string }
  | { readonly type: "selection/all-failed-toggled" }
  | { readonly type: "selection/cleared" }
  | {
      readonly type: "retry/started"
      readonly transactionIds: readonly string[]
    }
  | {
      readonly type: "retry/resolved"
      readonly result: RetryPaymentResult
    }

export interface TransactionsSummary {
  readonly successfulCount: number
  readonly failedCount: number
  readonly totalCents: number
}

export interface FailedSelectionState {
  readonly hasEligibleFailedTransactions: boolean
  readonly allEligibleFailedTransactionsSelected: boolean
  readonly someEligibleFailedTransactionsSelected: boolean
}

export function createDashboardState(
  transactions: readonly Transaction[]
): TransactionsDashboardState {
  return {
    retryingIds: [],
    selectedIds: [],
    transactions,
  }
}

export function transactionsDashboardReducer(
  state: TransactionsDashboardState,
  action: TransactionsDashboardAction
): TransactionsDashboardState {
  switch (action.type) {
    case "state/reset":
      return createDashboardState(action.transactions)
    case "selection/toggled":
      return toggleSelection(state, action.transactionId)
    case "selection/all-failed-toggled":
      return toggleAllFailedSelection(state)
    case "selection/cleared":
      return { ...state, selectedIds: [] }
    case "retry/started":
      return startRetries(state, action.transactionIds)
    case "retry/resolved":
      return resolveRetry(state, action.result)
    default:
      action satisfies never
      return state
  }
}

export function getRetryableSelectedIds(
  state: TransactionsDashboardState
): string[] {
  const retryingIdSet = new Set(state.retryingIds)

  return state.selectedIds.filter((transactionId) =>
    isRetryEligibleTransaction(findTransaction(state, transactionId), retryingIdSet)
  )
}

export function getRetryEligibleFailedTransactionIds(
  state: TransactionsDashboardState
): string[] {
  const retryingIdSet = new Set(state.retryingIds)

  return state.transactions
    .filter((transaction) =>
      isRetryEligibleTransaction(transaction, retryingIdSet)
    )
    .map((transaction) => transaction.id)
}

export function getFailedSelectionState(
  state: TransactionsDashboardState
): FailedSelectionState {
  const eligibleFailedTransactionIds = getRetryEligibleFailedTransactionIds(state)

  if (eligibleFailedTransactionIds.length === 0) {
    return {
      allEligibleFailedTransactionsSelected: false,
      hasEligibleFailedTransactions: false,
      someEligibleFailedTransactionsSelected: false,
    }
  }

  const selectedIdSet = new Set(state.selectedIds)
  const selectedEligibleCount = eligibleFailedTransactionIds.filter((id) =>
    selectedIdSet.has(id)
  ).length

  return {
    allEligibleFailedTransactionsSelected:
      selectedEligibleCount === eligibleFailedTransactionIds.length,
    hasEligibleFailedTransactions: true,
    someEligibleFailedTransactionsSelected:
      selectedEligibleCount > 0 &&
      selectedEligibleCount < eligibleFailedTransactionIds.length,
  }
}

export function getTransactionsSummary(
  transactions: readonly Transaction[]
): TransactionsSummary {
  let failedCount = 0
  let successfulCount = 0
  let totalCents = 0

  transactions.forEach((transaction) => {
    if (transaction.status === TRANSACTION_STATUS.FAILED) {
      failedCount += 1

      return
    }

    successfulCount += 1
    totalCents += transaction.amountCents
  })

  return {
    failedCount,
    successfulCount,
    totalCents,
  }
}

function toggleSelection(
  state: TransactionsDashboardState,
  transactionId: string
): TransactionsDashboardState {
  const retryingIdSet = new Set(state.retryingIds)
  const transaction = findTransaction(state, transactionId)

  if (!isRetryEligibleTransaction(transaction, retryingIdSet)) {
    return state
  }

  if (state.selectedIds.includes(transactionId)) {
    return {
      ...state,
      selectedIds: state.selectedIds.filter((id) => id !== transactionId),
    }
  }

  return {
    ...state,
    selectedIds: [...state.selectedIds, transactionId],
  }
}

function toggleAllFailedSelection(
  state: TransactionsDashboardState
): TransactionsDashboardState {
  const eligibleFailedTransactionIds = getRetryEligibleFailedTransactionIds(state)

  if (eligibleFailedTransactionIds.length === 0) {
    return state
  }

  const selectedIdSet = new Set(state.selectedIds)
  const eligibleFailedIdSet = new Set(eligibleFailedTransactionIds)
  const allEligibleSelected = eligibleFailedTransactionIds.every((id) =>
    selectedIdSet.has(id)
  )

  if (allEligibleSelected) {
    return {
      ...state,
      selectedIds: state.selectedIds.filter((id) => !eligibleFailedIdSet.has(id)),
    }
  }

  return {
    ...state,
    selectedIds: Array.from(
      new Set([...state.selectedIds, ...eligibleFailedTransactionIds])
    ),
  }
}

function startRetries(
  state: TransactionsDashboardState,
  transactionIds: readonly string[]
): TransactionsDashboardState {
  const retryingIdSet = new Set(state.retryingIds)
  const retryableIds = transactionIds.filter((transactionId) =>
    isRetryEligibleTransaction(findTransaction(state, transactionId), retryingIdSet)
  )

  if (retryableIds.length === 0) {
    return state
  }

  const retryingIds = Array.from(
    new Set([...state.retryingIds, ...retryableIds])
  )
  const startedRetryingIdSet = new Set(retryableIds)

  return {
    ...state,
    retryingIds,
    selectedIds: state.selectedIds.filter((id) => !startedRetryingIdSet.has(id)),
  }
}

function resolveRetry(
  state: TransactionsDashboardState,
  result: RetryPaymentResult
): TransactionsDashboardState {
  return {
    ...state,
    retryingIds: state.retryingIds.filter(
      (transactionId) => transactionId !== result.transactionId
    ),
    selectedIds: state.selectedIds.filter(
      (transactionId) => transactionId !== result.transactionId
    ),
    transactions: state.transactions.map((transaction) =>
      transaction.id === result.transactionId
        ? { ...transaction, status: result.status }
        : transaction
    ),
  }
}

function findTransaction(
  state: TransactionsDashboardState,
  transactionId: string
): Transaction | undefined {
  return state.transactions.find(
    (transaction) => transaction.id === transactionId
  )
}

function isRetryEligibleTransaction(
  transaction: Transaction | undefined,
  retryingIdSet: ReadonlySet<string>
): transaction is Transaction {
  return (
    transaction?.status === TRANSACTION_STATUS.FAILED &&
    !retryingIdSet.has(transaction.id)
  )
}

import { memo } from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  TransactionsSort,
  TransactionsSortColumn,
} from "@/modules/transactions-dashboard/model/dashboard/transactions-sorting"
import { TRANSACTIONS_SORT_COLUMN } from "@/modules/transactions-dashboard/model/dashboard/transactions-sorting"
import type { Transaction } from "@/modules/transactions-dashboard/model/transaction/transaction"
import type {
  InvoiceFeedback,
  RetryFeedback,
} from "@/modules/transactions-dashboard/ui/dashboard/dashboard-feedback"
import { PaymentHistoryRow } from "./PaymentHistoryRow"

interface PaymentHistoryTableProps {
  readonly canSelectAnyFailed: boolean
  readonly generatingInvoiceIdSet: ReadonlySet<string>
  readonly isAllFailedSelected: boolean
  readonly isSomeFailedSelected: boolean
  readonly retryingIdSet: ReadonlySet<string>
  readonly selectedIdSet: ReadonlySet<string>
  readonly sort: TransactionsSort | null
  readonly sortedTransactions: readonly Transaction[]
  readonly retryFeedbackById: Readonly<Record<string, RetryFeedback | undefined>>
  readonly invoiceFeedbackById: Readonly<
    Record<string, InvoiceFeedback | undefined>
  >
  readonly onToggleAllFailedSelection: () => void
  readonly onToggleSort: (column: TransactionsSortColumn) => void
  readonly onToggleSelection: (transactionId: string) => void
  readonly onDownloadInvoice: (transaction: Transaction) => void
}

function PaymentHistoryTableView({
  canSelectAnyFailed,
  generatingInvoiceIdSet,
  isAllFailedSelected,
  isSomeFailedSelected,
  retryingIdSet,
  selectedIdSet,
  sort,
  sortedTransactions,
  retryFeedbackById,
  invoiceFeedbackById,
  onToggleAllFailedSelection,
  onToggleSort,
  onToggleSelection,
  onDownloadInvoice,
}: PaymentHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={
                isAllFailedSelected
                  ? true
                  : isSomeFailedSelected
                    ? "indeterminate"
                    : false
              }
              disabled={!canSelectAnyFailed}
              className="cursor-pointer"
              aria-label="Select all failed transactions"
              onCheckedChange={() => onToggleAllFailedSelection()}
            />
          </TableHead>
          <TableHead>Transaction</TableHead>
          <SortableTableHead
            column={TRANSACTIONS_SORT_COLUMN.AMOUNT}
            label="Amount"
            sort={sort}
            onToggleSort={onToggleSort}
          />
          <SortableTableHead
            column={TRANSACTIONS_SORT_COLUMN.OCCURRED_AT}
            label="Date and time"
            sort={sort}
            onToggleSort={onToggleSort}
          />
          <SortableTableHead
            column={TRANSACTIONS_SORT_COLUMN.STATUS}
            label="Status"
            sort={sort}
            onToggleSort={onToggleSort}
          />
          <TableHead>Payment method</TableHead>
          <TableHead className="text-right">Invoice</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTransactions.map((transaction) => (
          <PaymentHistoryRow
            key={transaction.id}
            transaction={transaction}
            invoiceFeedback={invoiceFeedbackById[transaction.id]}
            isGeneratingInvoice={generatingInvoiceIdSet.has(transaction.id)}
            isRetrying={retryingIdSet.has(transaction.id)}
            isSelected={selectedIdSet.has(transaction.id)}
            retryFeedback={retryFeedbackById[transaction.id]}
            onDownloadInvoice={onDownloadInvoice}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </TableBody>
    </Table>
  )
}

interface SortableTableHeadProps {
  readonly column: TransactionsSortColumn
  readonly label: string
  readonly sort: TransactionsSort | null
  readonly onToggleSort: (column: TransactionsSortColumn) => void
}

function SortableTableHead({
  column,
  label,
  sort,
  onToggleSort,
}: SortableTableHeadProps) {
  const isActive = sort?.column === column
  const ariaSort = !isActive
    ? "none"
    : sort.direction === "desc"
      ? "descending"
      : "ascending"
  const indicator = !isActive ? (
    <ArrowUpDownIcon aria-hidden="true" className="size-3 text-muted-foreground" />
  ) : sort.direction === "desc" ? (
    <ArrowDownIcon aria-hidden="true" className="size-3" />
  ) : (
    <ArrowUpIcon aria-hidden="true" className="size-3" />
  )

  return (
    <TableHead aria-sort={ariaSort}>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto cursor-pointer px-2 py-1 text-left"
        aria-label={`Sort by ${label.toLowerCase()}`}
        onClick={() => onToggleSort(column)}
      >
        {label}
        {indicator}
      </Button>
    </TableHead>
  )
}

const PaymentHistoryTable = memo(PaymentHistoryTableView)

export { PaymentHistoryTable }

# Examples

## Component retry test shape

```tsx
it("retries selected payments concurrently and updates each row as it resolves", async () => {
  const user = userEvent.setup()
  const retryById = new Map<string, ReturnType<typeof deferred<RetryPaymentResult>>>()
  const retryPayment = vi.fn((transactionId: string) => {
    const retry = deferred<RetryPaymentResult>()
    retryById.set(transactionId, retry)
    return retry.promise
  })

  render(
    <TransactionsDashboardClient
      initialTransactions={listMockTransactions()}
      actions={createMockTransactionsDashboardActions({ retryPayment })}
    />
  )

  await user.click(screen.getByRole("checkbox", { name: /select failed transaction TXN-2026-0039/i }))
  await user.click(screen.getByRole("button", { name: /retry selected/i }))

  const row = screen.getByRole("row", { name: /TXN-2026-0039/i })
  expect(within(row).getByText("Retrying")).toBeInTheDocument()
})
```

## Invoice download component shape

```tsx
const downloadInvoice = vi.fn()

render(
  <TransactionsDashboardClient
    initialTransactions={listMockTransactions()}
    actions={createMockTransactionsDashboardActions({
      downloadInvoice,
      generateInvoice: async () => new Blob(["pdf"], { type: "application/pdf" }),
    })}
  />
)

await user.click(
  screen.getByRole("button", { name: /download invoice for TXN-2026-0042/i })
)

await waitFor(() => {
  expect(downloadInvoice).toHaveBeenCalledWith(
    expect.any(Blob),
    "invoice-INV-2026-0042-TXN-2026-0042.pdf"
  )
})
```

## Theme sync static check

```tsx
expect(readFileSync("app/layout.tsx", "utf8")).toContain("ThemeSyncScript")
expect(readFileSync("components/theme-sync-script.tsx", "utf8")).toContain(
  'id="transactions-dashboard-theme"'
)
```

## Popover interaction check

```tsx
await user.click(screen.getByRole("button", { name: /activity/i }))
expect(screen.getByRole("region", { name: "Activity log" })).toBeVisible()

await user.click(screen.getByRole("button", { name: /activity/i }))
expect(screen.queryByRole("region", { name: "Activity log" })).not.toBeVisible()
```

## Smell example

Avoid this:

```tsx
await new Promise((resolve) => window.setTimeout(resolve, 2000))
```

Prefer event/state synchronization:

```tsx
await expect(
  screen.getByText("Invoice INV-2026-0042 downloaded")
).toBeVisible()
```

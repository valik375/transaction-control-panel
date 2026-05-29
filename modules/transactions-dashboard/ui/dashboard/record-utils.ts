function omitKeys<T>(
  record: Readonly<Record<string, T | undefined>>,
  keys: readonly string[]
): Readonly<Record<string, T | undefined>> {
  const next = { ...record }

  keys.forEach((key) => {
    delete next[key]
  })

  return next
}

export { omitKeys }

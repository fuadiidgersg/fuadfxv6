export function getPlatformNow(platformDateOverride?: string) {
  const now = new Date()
  if (!platformDateOverride) return now

  const [year, month, day] = platformDateOverride.split('-').map(Number)
  if (!year || !month || !day) return now

  const next = new Date(now)
  next.setFullYear(year, month - 1, day)
  return next
}

export function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

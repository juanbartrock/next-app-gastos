export const parseDDMMYYYY = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined

  const parts = dateStr.split('/')
  if (parts.length !== 3) return undefined

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    year <= 1000 ||
    year >= 3000 ||
    day <= 0 ||
    day > 31 ||
    month < 0 ||
    month > 11
  ) {
    return undefined
  }

  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return date
}

export const formatDateToDDMMYYYY = (date?: Date): string => {
  if (!date) return ""

  try {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ""
  }
}

export const isValidDDMMYYYY = (dateStr: string): boolean => {
  return Boolean(parseDDMMYYYY(dateStr))
}

export const normalizeAmountInput = (value: string): string => {
  return value.replace(/\D/g, "")
}

export const amountDigitsToNumber = (digits: string): number => {
  const normalized = normalizeAmountInput(digits)
  if (!normalized) return 0
  return Number(normalized) / 100
}

export const formatAmountFromDigits = (
  digits: string,
  formatMoney: (value: number) => string
): string => {
  return formatMoney(amountDigitsToNumber(digits))
}

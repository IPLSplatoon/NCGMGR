export function pluralize (word: string, count: number, pluralWord?: string): string {
    const formattedCount = formatNumber(count)
    if (count === 1) return `${formattedCount} ${word}`
    else return !pluralWord ? `${formattedCount} ${word}s` : `${formattedCount} ${pluralWord}`
}

export function formatNumber (value: number): string {
    return new Intl.NumberFormat('en-US').format(value)
}

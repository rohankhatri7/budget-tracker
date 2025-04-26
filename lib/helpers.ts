import { Currencies } from "./currencies";

export function DatetoUTCDate(date: Date) {
    // Restore original implementation to preserve existing functionality
    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        )
    );
}

// Function to preserve the exact date when displaying in UI
export function preserveDateWithoutTimezone(dateInput: Date | string) {
    // Create a new date using only the year, month, and day parts
    // to avoid timezone-related shifts
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    return new Date(
        date.getUTCFullYear(), 
        date.getUTCMonth(), 
        date.getUTCDate()
    );
}

export function GetFormatterForCurrency(currency: string) {
    const locale = Currencies.find((c) => c.value === currency)?.locale;
  
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
}
  
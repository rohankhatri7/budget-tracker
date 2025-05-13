import { Currencies } from "./currencies";

//convert local date to UTC object to avoid issue of TIMEZONES
export function DatetoUTCDate(date: Date) {
    //treat date as UTC
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

//preserve the exact date when displaying in UI
export function preserveDateWithoutTimezone(dateInput: Date | string) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Date(
        date.getUTCFullYear(), 
        date.getUTCMonth(), 
        date.getUTCDate()
    );
}

//return currency formatter
export function GetFormatterForCurrency(currency: string) {
    const locale = Currencies.find((c) => c.value === currency)?.locale;
  
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
}
  
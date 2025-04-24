import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";

const DATE_RANGE_KEY = "global-date-range";
const STORAGE_KEY = "budget-tracker-date-range";

interface DateRange {
  from: Date;
  to: Date;
}

const defaultDateRange: DateRange = {
  from: startOfMonth(new Date()),
  to: new Date()
};

export function useDateRange() {
  const queryClient = useQueryClient();

  const { data: dateRange } = useQuery<DateRange>({
    queryKey: [DATE_RANGE_KEY],
    queryFn: () => {
      if (typeof window === 'undefined') {
        return defaultDateRange;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            from: new Date(parsed.from),
            to: new Date(parsed.to)
          };
        } catch (e) {
          console.error('Failed to parse saved date range:', e);
        }
      }
      return defaultDateRange;
    },
    staleTime: Infinity,
    initialData: defaultDateRange
  });

  const setDateRange = (newRange: DateRange) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          from: newRange.from.toISOString(),
          to: newRange.to.toISOString()
        }));
      } catch (e) {
        console.error('Failed to save date range to localStorage:', e);
      }
    }
    queryClient.setQueryData([DATE_RANGE_KEY], newRange);
  };

  return {
    dateRange,
    setDateRange,
  };
} 
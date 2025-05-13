import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth, subMonths } from "date-fns";

const DATE_RANGE_KEY = "global-date-range";
const STORAGE_KEY = "budget-tracker-date-range";

interface DateRange {
  from: Date;
  to: Date;
}

const defaultDateRange: DateRange = {
  from: subMonths(new Date(), 2),  // default last 3 months
  to: new Date()
};

//hook for global date range with localStorage + React Query
export function useDateRange() {
  const queryClient = useQueryClient();
  const { data: dateRange = defaultDateRange } = useQuery<DateRange>({ //load date range
    queryKey: [DATE_RANGE_KEY],
    queryFn: () => {
      if (typeof window === 'undefined') {
        return defaultDateRange;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const from = new Date(parsed.from);
          const to = new Date(parsed.to);
          
          //validate the dates
          if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            throw new Error('Invalid date format');
          }
          
          return { from, to };
        } catch (e) {
          console.error('Failed to parse saved date range:', e);
          localStorage.removeItem(STORAGE_KEY); //remove invalid data
          return defaultDateRange;
        }
      }
      return defaultDateRange;
    },
    staleTime: Infinity, //dont auto-refetch
    initialData: defaultDateRange
  });

  //save new date
  const setDateRange = (newRange: DateRange) => {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          from: newRange.from.toISOString(),
          to: newRange.to.toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save date range to localStorage:', e);
      }
    }
    queryClient.setQueryData([DATE_RANGE_KEY], newRange); //update local cache
  };

  return {
    dateRange,
    setDateRange,
  };
} 
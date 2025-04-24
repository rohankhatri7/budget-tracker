import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";

const DATE_RANGE_KEY = "global-date-range";

interface DateRange {
  from: Date;
  to: Date;
}

export function useDateRange() {
  const queryClient = useQueryClient();

  const { data: dateRange } = useQuery<DateRange>({
    queryKey: [DATE_RANGE_KEY],
    initialData: {
      from: startOfMonth(new Date()),
      to: new Date(),
    },
    staleTime: Infinity,
  });

  const setDateRange = (newRange: DateRange) => {
    queryClient.setQueryData([DATE_RANGE_KEY], newRange);
  };

  return {
    dateRange,
    setDateRange,
  };
} 
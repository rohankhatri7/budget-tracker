import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays } from "date-fns";
import { z } from "zod";

//schema for validating date range
export const OverviewQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((args) => {
    const { from, to } = args;
    const days = differenceInDays(to, from);
    return days >= 0 && days <= MAX_DATE_RANGE_DAYS; //'from' should come before 'to' & doesnot exceed max
  }, {
    message: `Date range must be between 0 and ${MAX_DATE_RANGE_DAYS} days`
  });
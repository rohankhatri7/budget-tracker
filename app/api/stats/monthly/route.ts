import prisma from "@/lib/prisma";
import { OverviewQuerySchema } from "@/schema/overview";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

//GET returns monthly income/expense
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return Response.json({ error: "Missing date parameters" }, { status: 400 });
  }

  const queryParams = OverviewQuerySchema.safeParse({
    from: new Date(from),
    to: new Date(to),
  });

  if (!queryParams.success) {
    return Response.json(
      { error: queryParams.error.message },
      {
        status: 400,
      }
    );
  }

  try { //generate monthly income/expense
    const stats = await getMonthlyStats(user.id, queryParams.data.from, queryParams.data.to);
    return Response.json(stats);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      {
        status: 500,
      }
    );
  }
}

export type GetMonthlyStatsResponseType = Awaited<ReturnType<typeof getMonthlyStats>>;

async function getMonthlyStats(userId: string, from: Date, to: Date) { //normalize dates for full days
  const fromDate = new Date(from);
  const toDate = new Date(to);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  //get all transactions within the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      date: true,
      amount: true,
      type: true,
    },
  });

  //group transactions by month and year
  const monthlyStats = new Map<string, { income: number; expense: number }>();

  transactions.forEach(transaction => {
    const month = transaction.date.getUTCMonth() + 1;
    const year = transaction.date.getUTCFullYear();
    const key = `${month}/${year}`;

    if (!monthlyStats.has(key)) {
      monthlyStats.set(key, { income: 0, expense: 0 });
    }

    const stats = monthlyStats.get(key)!;
    if (transaction.type === 'income') {
      stats.income += transaction.amount;
    } else {
      stats.expense += transaction.amount;
    }
  });

  //convert map to array for JSON
  return Array.from(monthlyStats.entries()).map(([month, stats]) => ({
    month,
    income: stats.income,
    expense: stats.expense,
  }));
} 
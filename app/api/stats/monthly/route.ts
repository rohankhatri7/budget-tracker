import prisma from "@/lib/prisma";
import { OverviewQuerySchema } from "@/schema/overview";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

  try {
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

async function getMonthlyStats(userId: string, from: Date, to: Date) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const monthlyStats = await prisma.monthHistory.groupBy({
    by: ["month", "year"],
    where: {
      userId,
      year: {
        gte: fromDate.getUTCFullYear(),
        lte: toDate.getUTCFullYear(),
      },
      month: {
        gte: fromDate.getUTCMonth(),
        lte: toDate.getUTCMonth(),
      },
    },
    _sum: {
      income: true,
      expense: true,
    },
  });

  return monthlyStats.map(stat => ({
    month: `${stat.month + 1}/${stat.year}`,
    income: stat._sum.income || 0,
    expense: stat._sum.expense || 0,
  }));
} 
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type GetCategoriesStatsResponseType = Awaited<ReturnType<typeof getCategoriesStats>>;

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

  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Set the time to the beginning and end of the day
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const stats = await getCategoriesStats(user.id, fromDate, toDate);
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

async function getCategoriesStats(userId: string, from: Date, to: Date) {
  // First get all categories for the user
  const categories = await prisma.category.findMany({
    where: {
      userId,
    },
    select: {
      name: true,
      icon: true,
      type: true,
    },
  });

  // Then get transaction stats
  const transactionStats = await prisma.transaction.groupBy({
    by: ["category", "categoryIcon", "type"],
    where: {
      userId,
      date: {
        gte: from,
        lte: to,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Combine categories with transaction stats, showing 0 for categories without transactions
  return categories.map(category => ({
    category: category.name,
    categoryIcon: category.icon,
    type: category.type,
    _sum: {
      amount: transactionStats.find(
        stat => 
          stat.category === category.name && 
          stat.type === category.type
      )?._sum.amount || 0
    }
  }));
}
  
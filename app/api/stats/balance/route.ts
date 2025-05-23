import prisma from "@/lib/prisma"
import { OverviewQuerySchema } from "@/schema/overview"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const user = await currentUser()
  if (!user) {
    redirect("/sign-in")
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!from || !to) {
    return Response.json({ error: "Missing date parameters" }, { status: 400 })
  }

  //validate date params using Zod schema
  const queryParams = OverviewQuerySchema.safeParse({
    from: new Date(from),
    to: new Date(to),
  })

  if (!queryParams.success) {
    return Response.json(
      { error: queryParams.error.message },
      {
        status: 400,
      },
    )
  }

  try {
    const stats = await getBalanceStats(user.id, queryParams.data.from, queryParams.data.to) //get summed income/expense in daterange

    return Response.json(stats)
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      {
        status: 500,
      },
    )
  }
}

export type GetBalanceStateResponseType = Awaited<ReturnType<typeof getBalanceStats>>

async function getBalanceStats(userId: string, from: Date, to: Date) { //normalize dates for full days
  const fromDate = new Date(from)
  const toDate = new Date(to)
  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(23, 59, 59, 999)

  const totals = await prisma.transaction.groupBy({ //group transactions by type & sum amounts
    by: ["type"],
    where: {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _sum: {
      amount: true,
    },
  })

  return {
    expense: totals.find((t) => t.type === "expense")?._sum.amount || 0,
    income: totals.find((t) => t.type === "income")?._sum.amount || 0,
  }
}


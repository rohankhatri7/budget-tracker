import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { TransactionType } from "@/lib/types";

const GetTransactionsSchema = z.object({
  from: z.string(),
  to: z.string(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const result = GetTransactionsSchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      category: searchParams.get("category") || undefined,
      type: searchParams.get("type") || undefined,
    });

    if (!result.success) {
      return new NextResponse("Invalid parameters", { status: 400 });
    }

    const { from, to, category, type } = result.data;
    
    console.log("Transactions API - received search parameters:", {
      from,
      to,
      category,
      type
    });

    //convert date strings to Objects and normalize
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    console.log("Transactions API - adjusted date range:", {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString()
    });

    //Prisma query filters
    const whereClause = {
      userId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
      ...(category && { category }),
      ...(type && { type }),
    };
    
    console.log("Transactions API - using where clause:", JSON.stringify(whereClause, null, 2));

    //query and return matching transactions in desc order
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
    });
    
    console.log(`Transactions API - found ${transactions.length} transactions`);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
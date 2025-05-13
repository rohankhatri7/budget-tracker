"use server"

import prisma from "@/lib/prisma"
import { CreateTransactionSchema, type CreateTransactionSchemaType } from "@/schema/transaction"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form) //validate form input
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message)
  }

  const user = await currentUser()
  if (!user) {
    redirect("/sign-in") //make user login
  }

  const { amount, category, date, description, type } = parsedBody.data

  try {
    //confirm category exists
    const categoryRow = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: category,
      },
    })

    if (!categoryRow) {
      throw new Error("category not found")
    }

    //wrap transaction creation + history update in a single db transaction
    await prisma.$transaction([
      
      prisma.transaction.create({
        data: {
          userId: user.id,
          amount,
          date,
          description: description || "",
          type,
          category: categoryRow.name,
          categoryIcon: categoryRow.icon,
        },
      }),

      //create or update monthly totals
      prisma.monthHistory.upsert({
        where: {
          day_month_year_userId: {
            userId: user.id,
            day: date.getUTCDate(),
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: user.id,
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          expense: type === "expense" ? amount : 0,
          income: type === "income" ? amount : 0,
        },
        update: {
          expense: { increment: type === "expense" ? amount : 0 },
          income: { increment: type === "income" ? amount : 0 },
        },
      }),

      //create or update yearly totals
      prisma.yearHistory.upsert({
        where: {
          month_year_userId: {
            userId: user.id,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: user.id,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          expense: type === "expense" ? amount : 0,
          income: type === "income" ? amount : 0,
        },
        update: {
          expense: { increment: type === "expense" ? amount : 0 },
          income: { increment: type === "income" ? amount : 0 },
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error("Transaction creation error:", error)
    throw error
  }
}

export async function DeleteTransaction(transactionId: string) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  try { //fetch transaction to get info in case of rollback
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
        userId: user.id, // check user owns the transaction
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found or you do not have permission to delete it");
    }

    const { date, amount, type } = transaction;

    //
    try {
      await prisma.$transaction([
        //delete transaction
        prisma.transaction.delete({
          where: {
            id: transactionId,
            userId: user.id,
          },
        }),

        //subtract from monthly totals
        prisma.monthHistory.update({
          where: {
            day_month_year_userId: {
              userId: user.id,
              day: date.getUTCDate(),
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          data: {
            expense: { decrement: type === "expense" ? amount : 0 },
            income: { decrement: type === "income" ? amount : 0 },
          },
        }),

        // subtract from yearly totals
        prisma.yearHistory.update({
          where: {
            month_year_userId: {
              userId: user.id,
              month: date.getUTCMonth(),
              year: date.getUTCFullYear(),
            },
          },
          data: {
            expense: { decrement: type === "expense" ? amount : 0 },
            income: { decrement: type === "income" ? amount : 0 },
          },
        }),
      ]);
    } catch (txError) {
      console.error("Transaction operation failed:", txError);
      throw new Error("Failed to delete transaction. Database update error.");
    }

    return { success: true }; //return success if all steps succeed
  } catch (error) {
    console.error("Transaction deletion error:", error);
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unknown error during transaction deletion");
  }
}


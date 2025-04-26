"use server"

import prisma from "@/lib/prisma"
import { CreateTransactionSchema, type CreateTransactionSchemaType } from "@/schema/transaction"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form)
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message)
  }

  const user = await currentUser()
  if (!user) {
    redirect("/sign-in")
  }

  const { amount, category, date, description, type } = parsedBody.data

  try {
    // Confirm the category exists
    const categoryRow = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: category,
      },
    })

    if (!categoryRow) {
      throw new Error("category not found")
    }

    // Create the transaction & update aggregates in a single transaction
    await prisma.$transaction([
      // 1. Create user transaction
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

      // 2. Upsert monthHistory (Composite ID: @@id([day, month, year, userId]))
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

      // 3. Upsert yearHistory (Composite ID: @@id([month, year, userId]))
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

  try {
    // First get the transaction to get its details (date, amount, type)
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
        userId: user.id, // Security check to ensure user owns the transaction
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found or you do not have permission to delete it");
    }

    const { date, amount, type } = transaction;

    // Now perform deletion and update aggregates in a transaction
    try {
      await prisma.$transaction([
        // 1. Delete the transaction
        prisma.transaction.delete({
          where: {
            id: transactionId,
            userId: user.id, // Extra security check
          },
        }),

        // 2. Update monthHistory (decrement the appropriate amount)
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

        // 3. Update yearHistory (decrement the appropriate amount)
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

    return { success: true };
  } catch (error) {
    console.error("Transaction deletion error:", error);
    // Make sure we throw an error that can be serialized
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unknown error during transaction deletion");
  }
}


import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { TransactionType } from "@/lib/types";

//handle GET requests for fetching user categories
export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as TransactionType | null;

    const categories = await prisma.category.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      name: z.string(),
      icon: z.string(),
      type: z.enum(["income", "expense"]),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { name, icon, type } = result.data;
    const category = await prisma.category.create({
      data: {
        name,
        icon,
        type,
        userId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

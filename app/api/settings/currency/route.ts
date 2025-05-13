import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

//put request for user currency settings
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      currency: z.string(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    //update currency in user settings table
    const { currency } = result.data;
    const userSettings = await prisma.userSettings.update({
      where: {
        userId,
      },
      data: {
        currency,
      },
    });

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error updating currency:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
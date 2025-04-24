import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the categoryId which should be in format "name|type"
    const [name, type] = params.categoryId.split("|");
    if (!name || !type) {
      return new NextResponse("Invalid category ID format", { status: 400 });
    }

    // Delete the category using the composite key
    await prisma.category.delete({
      where: {
        name_userId_type: {
          name,
          userId,
          type,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
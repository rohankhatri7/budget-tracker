import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

//delete user category using composite key
export async function DELETE(
  req: Request, 
  { params }: { params: { categoryId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    //parse the categoryId which should be in format "name|type"
    const [name, type] = params.categoryId.split("|");
    if (!name || !type) {
      return new NextResponse("Invalid category ID format", { status: 400 });
    }

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
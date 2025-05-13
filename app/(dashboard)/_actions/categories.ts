"use server"; //server side execution

import prisma from "@/lib/prisma";
import {
  CreateCategorySchema,
  CreateCategorySchemaType,
} from "@/schema/categories";
import { currentUser } from "@clerk/nextjs/server";

import { redirect } from "next/navigation";

export async function CreateCategory(form: CreateCategorySchemaType) { //create category from form data
  const parsedBody = CreateCategorySchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in"); //redirect to sign in if not logged in
  }

  const { name, icon, type } = parsedBody.data;

  return await prisma.category.create({
    data: {
      userId: user.id, //associate creaetd category w/ user
      name,
      icon,
      type,
    },
  });
}

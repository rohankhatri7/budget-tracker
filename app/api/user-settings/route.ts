import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
    const user = await currentUser()

    if (!user) { //redirect to sign in page if no user
        redirect("/sign-in");
    }

    let userSettings = await prisma.userSettings.findUnique({
        where: {
            userID: user.id, 
        },
    });

    if (!userSettings) { //set following as default settings if none saved
        userSettings = await prisma.userSettings.create({
            data: {
                userID: user.id,
                currency: "USD", 
            }
        })
    }
    revalidatePath("/"); //revalidate the home page that uses the user currency
    return Response.json(userSettings);
}
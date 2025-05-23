import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ManageClient from "./_components/ManageClient";

export const dynamic = "force-dynamic";

async function ManagePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!userSettings) {
    redirect("/wizard");
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 px-6">
          <div>
            <h1 className="text-3xl font-bold">Manage</h1>
            <p className="text-muted-foreground">Manage your account settings and categories</p>
          </div>
        </div>
      </div>
      <ManageClient userSettings={userSettings} />
    </div>
  );
}

export default ManagePage; 
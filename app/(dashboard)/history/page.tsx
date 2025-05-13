import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import HistoryClient from "./_components/HistoryClient";

export const dynamic = "force-dynamic"; //no caching

async function HistoryPage() {
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
    redirect("/wizard"); //redirect if user did not complete initial setup
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 px-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">View your transaction analytics and insights</p>
          </div>
        </div>
      </div>
      <HistoryClient userSettings={userSettings} />
    </div>
  );
}

export default HistoryPage; 
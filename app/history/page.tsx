import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import HistoryClient from "./_components/HistoryClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    redirect("/wizard");
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 px-6">
          <h1 className="text-3xl font-bold">History & Analytics</h1>
        </div>
        <div className="px-6 pb-4">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" asChild>
                <Link href="/">Dashboard</Link>
              </TabsTrigger>
              <TabsTrigger value="transactions" asChild>
                <Link href="/transactions">Transactions</Link>
              </TabsTrigger>
              <TabsTrigger value="history" asChild>
                <Link href="/history">History</Link>
              </TabsTrigger>
              <TabsTrigger value="manage" asChild>
                <Link href="/manage">Manage</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <HistoryClient userSettings={userSettings} />
    </div>
  );
}

export default HistoryPage; 
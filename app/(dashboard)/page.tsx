import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react';
import CreateTransactionDialog from './_components/CreateTransactionDialog';
import Overview from './_components/Overview';

async function Page() { 
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
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 px-4">
          <p className="text-3xl font-bold">
            Hello, {user.firstName}! 👋
          </p>

          <div className="flex items-center gap-3 pr-8">
            <CreateTransactionDialog trigger = {<Button
              variant="ghost"
              className="border-2 border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              New income 🤑
            </Button>}
            type='income' />
            
            <CreateTransactionDialog trigger={<Button
              variant="ghost"
              className="border-2 border-rose-500 bg-rose-600 text-white hover:bg-rose-700"
            >
              New expense 😠
            </Button>}
            type='expense' />
          </div>
        </div>
      </div>
      <Overview userSettings={userSettings} />
    </div>
  );
}

export default Page;
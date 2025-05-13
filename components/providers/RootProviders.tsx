"use client";

import { ThemeProvider } from 'next-themes';
import React, { ReactNode } from 'react'
import {Query, QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"

//wraps the app with QueryClient and Theme context providers
function RootProviders({children} : {children: ReactNode}) {
  const [queryClient] = React.useState(() => new QueryClient({}));
  return (
    <QueryClientProvider client = {queryClient}>
    <ThemeProvider
        attribute="class"
        defaultTheme='dark'
        enableSystem
        disableTransitionOnChange>
            {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
  )
}

export default RootProviders
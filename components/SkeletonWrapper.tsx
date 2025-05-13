import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

//wrap in a Skeleton loader while data is loading
function SkeletonWrapper({
  children,
  isLoading,
  fullWidth = true,
}: {
  children: ReactNode;
  isLoading: boolean;
  fullWidth?: boolean;
}) {
  //if not loading just render
  if (!isLoading) return children;

  return (
    <Skeleton className={cn(fullWidth && "w-full")}>
      <div className="opacity-0">{children}</div>
    </Skeleton>
  );
}

export default SkeletonWrapper;

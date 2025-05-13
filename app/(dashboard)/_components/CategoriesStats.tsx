"use client"; //client side rendering

import { GetCategoriesStatsResponseType } from '@/app/api/stats/categories/route';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DatetoUTCDate, GetFormatterForCurrency } from '@/lib/helpers';
import { TransactionType } from '@/lib/types';
import { UserSettings } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useRef, useState, MouseEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
interface Props {
  userSettings: UserSettings;
  from: Date;
  to: Date;
}

function CategoriesStats({ userSettings, from, to }: Props) {
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DatetoUTCDate(from)}&to=${DatetoUTCDate(to)}`
      ).then((res) => res.json()),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type="income"
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type="expense"
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
    </div>
  );
}

function CategoriesCard({
  data,
  type,
  formatter,
}: {
  type: TransactionType;
  formatter: Intl.NumberFormat;
  data: GetCategoriesStatsResponseType;
}) {
  const filteredData = data
    .filter((el) => el.type === type)
    .sort((a, b) => (b._sum?.amount || 0) - (a._sum?.amount || 0));

  const total = filteredData.reduce(
    (acc, el) => acc + (el._sum?.amount || 0),
    0
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Handle mouse movement over the card
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    // Get card dimensions and position
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the card center
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (max 8 degrees in each direction)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on mouse position
    // Further from center = more rotation
    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 8;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  // Reset rotation when mouse leaves
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  // Set hovering state when mouse enters
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full perspective-1000 h-80"
    >
      <Card 
        className={`
          h-80 w-full
          transition-transform duration-200 ease-out 
          transform-gpu will-change-transform 
          shadow-lg hover:shadow-xl
          ${isHovering ? 'bg-gradient-to-br from-background to-background/90' : ''}
        `}
        style={{ 
          transform: isHovering ? 
            `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)` : 
            'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
        }}
      >
        <CardHeader 
          className="transition-transform duration-200"
          style={{ 
            transform: isHovering ? 'translateZ(15px)' : 'translateZ(0px)'
          }}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              {type === "income" ? (
                <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20L12 4M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
            <span className={`${type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
              {formatter.format(total)}
            </span>
          </CardTitle>
        </CardHeader>
    
        <div 
          className="flex items-center justify-between gap-2 transition-transform duration-200"
          style={{ 
            transform: isHovering ? 'translateZ(20px)' : 'translateZ(0px)'
          }}
        >
          {filteredData.length === 0 && (
            <div className="flex h-60 w-full flex-col items-center justify-center">
              No categories found
              <p className="text-sm text-muted-foreground">
                Try adding new {type === "income" ? "income" : "expense"} categories
              </p>
            </div>
          )}

          {filteredData.length > 0 && (
            <ScrollArea className="h-60 w-full px-4">
              <div className="flex w-full flex-col gap-4 p-4">
                {filteredData.map(item => {
                  const amount = item._sum?.amount || 0;
                  const percentage = total > 0 ? (amount * 100) / total : 0;

                  return (
                    <div key={item.category} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {item.categoryIcon} {item.category} 
                          <span className="text-sm text-white">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </span>
                        <span className={`${type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                          {formatter.format(amount)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full ${
                            type === "income" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CategoriesStats;

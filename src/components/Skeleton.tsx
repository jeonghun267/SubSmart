"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-bg-card rounded-[12px] p-5 border border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-[12px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="w-10 h-10 rounded-[12px]" />
      </div>
      {/* Main card */}
      <Skeleton className="h-[140px] w-full rounded-[16px]" />
      {/* Section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

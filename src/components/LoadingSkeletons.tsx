import { cn } from "@/lib/utils";

// Generic Skeleton Loader
export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-700 rounded",
        className
      )}
    />
  );
}

// Loading Card (for project/event cards)
export function LoadingCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <SkeletonLoader className="h-40 w-full rounded-md" />
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-3 w-1/2" />
      <div className="flex gap-2">
        <SkeletonLoader className="h-8 w-8 rounded-full" />
        <SkeletonLoader className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

// Loading Card Grid
export function LoadingCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

// Loading List Item
export function LoadingListItem() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Loading List
export function LoadingList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingListItem key={i} />
      ))}
    </div>
  );
}

// Dashboard Stats Loading
export function LoadingStatCard() {
  return (
    <div className="border rounded-lg p-6 space-y-3 animate-pulse">
      <SkeletonLoader className="h-4 w-1/3" />
      <SkeletonLoader className="h-8 w-1/2" />
      <SkeletonLoader className="h-3 w-2/3" />
    </div>
  );
}

export function LoadingStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingStatCard key={i} />
      ))}
    </div>
  );
}

// Loading Table Row
export function LoadingTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <SkeletonLoader className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <LoadingTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

// Loading Message/Chat
export function LoadingMessage() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-3">
        <SkeletonLoader className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-1/4" />
          <SkeletonLoader className="h-16 w-3/4 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function LoadingChat({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingMessage key={i} />
      ))}
    </div>
  );
}

// Loading Profile Section
export function LoadingProfile() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <SkeletonLoader className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-5 w-1/3" />
          <SkeletonLoader className="h-4 w-1/2" />
          <SkeletonLoader className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Full Page Loading Overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline Loading Spinner
export function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-primary border-slate-200 dark:border-slate-700",
        sizeClasses[size]
      )}
    />
  );
}

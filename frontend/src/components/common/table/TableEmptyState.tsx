"use client";

import React from "react";
import { Inbox } from "lucide-react";

export interface TableEmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function TableEmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
  className = "",
}: TableEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center ${className}`}
    >
      <div className="rounded-2xl bg-stone-100 p-3 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        <Icon className="h-6 w-6" />
      </div>
      {title && (
        <h4 className="text-sm font-bold text-stone-900 dark:text-white">
          {title}
        </h4>
      )}
      <p className="max-w-md text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        {message}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

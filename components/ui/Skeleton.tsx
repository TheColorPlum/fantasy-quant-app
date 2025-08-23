"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-muted",
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Dashboard skeleton rows
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-6">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[80px]" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Content area skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-[150px]" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Players skeleton rows  
export function PlayersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filters skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      
      {/* Table header skeleton */}
      <div className="rounded-md border">
        <div className="flex items-center space-x-4 border-b p-4">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        
        {/* Table rows skeleton */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 border-b p-4 last:border-b-0">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[60px]" />
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

// Proposals skeleton rows
export function ProposalsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header with actions skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[180px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      
      {/* Filters skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-[120px]" />
        <Skeleton className="h-9 w-[100px]" />
        <Skeleton className="h-9 w-[100px]" />
      </div>
      
      {/* Proposals list skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            {/* Proposal header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-[80px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            
            {/* Trade details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <div className="space-y-1">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <div className="space-y-1">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Analysis section */}
            <div className="border-t pt-4 space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <div className="grid gap-2 md:grid-cols-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-4">
              <Skeleton className="h-4 w-[200px]" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-8 w-[80px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
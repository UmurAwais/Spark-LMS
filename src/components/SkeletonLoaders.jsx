import React from 'react';

export function CourseCardSkeleton() {
  return (
    <div className="block rounded-md ring-1 ring-slate-200 bg-white overflow-hidden h-full animate-pulse">
      {/* Image skeleton */}
      <div className="p-3 pb-0">
        <div className="overflow-hidden rounded-md h-48 bg-gray-200" />
      </div>

      {/* Content skeleton */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Badge */}
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>

        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-20" />

        {/* Meta info */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-100 rounded w-16" />
          <div className="h-6 bg-gray-100 rounded w-24" />
          <div className="h-6 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function CourseDetailSkeleton() {
  return (
    <div className="bg-[#f7f9fa] pb-16 animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-[#1c1d1f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="h-8 bg-gray-700 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-700 rounded w-full max-w-3xl mb-3" />
          <div className="h-4 bg-gray-700 rounded w-48 mb-4" />
          <div className="flex gap-3">
            <div className="h-5 bg-gray-700 rounded w-24" />
            <div className="h-5 bg-gray-700 rounded w-32" />
            <div className="h-5 bg-gray-700 rounded w-28" />
          </div>
        </div>
      </section>

      {/* Body skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* What you'll learn */}
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full" />
                  <div className="h-5 bg-gray-100 rounded flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-md shadow-sm p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="w-full lg:w-80 cursor-pointer">
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="w-full aspect-video bg-gray-200" />
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

import { Loader } from 'lucide-react';

export function AdminLoader() {
  return (
    <div className="absolute inset-0 flex items-start justify-center pt-64 z-10">
      <div className="bg-white/90 p-4 rounded-full shadow-xl backdrop-blur-sm border border-gray-100">
        <Loader className="animate-spin text-[#0d9c06]" size={32} />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="animate-pulse relative min-h-screen">
      <AdminLoader />

      {/* Header */}
      <div className="mb-8 opacity-50">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-96" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-md shadow-lg p-6 h-32 border border-gray-100">
            <div className="flex justify-between mb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-md" />
              <div className="h-5 w-5 bg-gray-200 rounded" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 opacity-50">
        {/* Recent Orders Skeleton */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6 h-64">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-gray-100 rounded" />
              <div className="h-12 bg-gray-100 rounded" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="bg-gray-100 rounded-md p-6 h-40" />
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="animate-pulse relative min-h-screen">
      <AdminLoader />
      {/* Header Skeleton */}
      <div className="mb-6 opacity-50">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>
      {/* Search Bar Skeleton */}
      <div className="mb-6 h-10 bg-gray-100 rounded-md opacity-50 w-full max-w-md" />
      
      {/* Table Skeleton */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden opacity-50">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 border-b border-gray-100 bg-white p-4 flex items-center gap-4">
             <div className="h-10 w-10 bg-gray-200 rounded-full" />
             <div className="flex-1 space-y-2">
               <div className="h-4 bg-gray-200 rounded w-1/4" />
               <div className="h-3 bg-gray-100 rounded w-1/3" />
             </div>
             <div className="h-8 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminGridSkeleton() {
  return (
    <div className="animate-pulse relative min-h-screen">
      <AdminLoader />
      {/* Header Skeleton */}
      <div className="mb-6 flex justify-between opacity-50">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-md border border-gray-200 overflow-hidden h-80">
            <div className="h-40 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

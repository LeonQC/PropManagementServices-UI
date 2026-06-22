import type { PropertyResponse } from "../../api/types";
import PropertyCard from "./PropertyCard";

interface Props {
  properties: PropertyResponse[];
  isLoading: boolean;
  isError: boolean;
  pageSize: number;
  onRetry: () => void;
}

export default function PropertyGrid({ properties, isLoading, isError, pageSize, onRetry }: Props) {
  if (isError) {
    return (
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-16 text-center">
        <p className="text-slate-600">Couldn't load properties.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: pageSize }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500">
        No properties found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-44 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

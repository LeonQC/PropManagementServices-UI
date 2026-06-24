import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProperties } from "../api/properties";
import { EMPTY_FILTERS, type PropertyFilters } from "../lib/filters";
import FilterBar from "../components/listings/FilterBar";
import PropertyGrid from "../components/listings/PropertyGrid";
import Pagination from "../components/listings/Pagination";

const PAGE_SIZE = 12;

export default function ListingsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PropertyFilters>(EMPTY_FILTERS);

  // Any filter change resets to the first page (the old page may not exist).
  const handleFiltersChange = (next: PropertyFilters) => {
    setFilters(next);
    setPage(1);
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["properties", page, filters],
    queryFn: ({ signal }) => getProperties(page, PAGE_SIZE, filters, signal),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const metroCount = new Set(
    items.map((p) => p.address?.metroArea).filter(Boolean)
  ).size;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Property Listings</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle(totalCount, metroCount)}</p>
        </div>
        <button
          type="button"
          title="Coming soon"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
        >
          <span className="text-base leading-none">+</span>
          Add Property
        </button>
      </div>

      <FilterBar filters={filters} onChange={handleFiltersChange} />

      <div className="mt-6">
        <PropertyGrid
          properties={items}
          isLoading={isLoading}
          isError={isError}
          pageSize={PAGE_SIZE}
          onRetry={() => refetch()}
        />
      </div>

      <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}

function subtitle(totalCount: number, metroCount: number): string {
  if (totalCount === 0) return "No properties yet";
  const props = `${totalCount} ${totalCount === 1 ? "property" : "properties"}`;
  if (metroCount === 0) return props;
  return `${props} across ${metroCount} US metro ${metroCount === 1 ? "market" : "markets"}`;
}

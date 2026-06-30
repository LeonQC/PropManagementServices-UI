import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProperties } from "../api/properties";
import { DEFAULT_SORT, EMPTY_FILTERS, type PropertyFilters } from "../lib/filters";
import { useDebounce } from "../lib/useDebounce";
import FilterBar from "../components/listings/FilterBar";
import PropertyGrid from "../components/listings/PropertyGrid";
import Pagination from "../components/listings/Pagination";
import AddPropertyModal from "../components/listings/AddPropertyModal";

const PAGE_SIZE = 12;

export default function ListingsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PropertyFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Debounce the keyword so we query once typing settles, not per keystroke.
  const debouncedSearch = useDebounce(search.trim(), 300);

  // Changing filters, sort, or the search term invalidates the current page
  // (the old page number may not exist in the new result set), so reset to 1.
  useEffect(() => {
    setPage(1);
  }, [filters, sort, debouncedSearch]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["properties", page, filters, sort, debouncedSearch],
    queryFn: ({ signal }) =>
      getProperties(page, PAGE_SIZE, filters, sort, debouncedSearch, signal),
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
          onClick={() => setIsAddOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
        >
          <span className="text-base leading-none">+</span>
          Add Property
        </button>
      </div>

      {isAddOpen && <AddPropertyModal onClose={() => setIsAddOpen(false)} />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
      />

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

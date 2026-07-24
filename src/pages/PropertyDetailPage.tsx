import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProperty } from "../api/properties";
import {
  formatAddress,
  formatDate,
  formatMoney,
  formatPercent,
  formatRate,
  formatSqft,
} from "../lib/format";
import { statusMeta, typeBadgeClasses } from "../lib/status";
import CreateDealModal from "../components/acquisitions/CreateDealModal";

// Property detail page (design doc §5.1): full description, AI summary, a
// financial summary and property details, plus the "Start acquisition" CTA.
export default function PropertyDetailPage() {
  const { propertyId = "" } = useParams();
  const [dealOpen, setDealOpen] = useState(false);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: ({ signal }) => getProperty(propertyId, signal),
    enabled: propertyId.length > 0,
  });

  if (isLoading) {
    return <div className="mt-10 animate-pulse text-center text-sm text-slate-400">Loading property…</div>;
  }
  if (isError || !property) {
    return (
      <div className="mt-10 text-center text-sm text-slate-500">
        Property not found.{" "}
        <Link to="/listings" className="font-medium text-brand hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  const status = statusMeta(property.status);
  const addr = property.address;
  const canStart = property.status === "listed";

  return (
    <div>
      <Link
        to="/listings"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <BackIcon />
        Back to listings
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{property.title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className={status.text}>{status.label}</span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClasses(property.propertyType)}`}>
              {property.propertyType}
            </span>
            {property.propertySubtype && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {property.propertySubtype}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatAddress(addr?.street, addr?.city, addr?.state) || "—"}
            {addr?.metroArea ? ` · ${addr.metroArea}` : ""}
            {addr?.neighborhood ? ` · ${addr.neighborhood}` : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={!canStart}
          title={canStart ? "Create a deal from this listing" : "Only listed properties can start a deal"}
          onClick={() => setDealOpen(true)}
          className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start acquisition
        </button>
      </div>

      {/* Body */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <HeroImage id={property.id} />

          <Panel title="About this property">
            {property.descriptionText?.trim() ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {property.descriptionText}
              </p>
            ) : (
              <p className="text-sm text-slate-400">No description provided.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Financial summary">
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="Asking price" value={formatMoney(property.askingPrice)} />
              <Stat label="Cap rate" value={formatRate(property.capRate)} />
              <Stat label="Market benchmark" value={formatRate(property.marketCapRateBenchmark)} />
              <Stat label="Occupancy" value={formatPercent(property.occupancyRate)} />
              <Stat label="NOI" value={formatMoney(property.noi)} />
              <Stat label="Year-1 NOI est." value={formatMoney(property.year1NoiEstimate)} />
            </dl>
          </Panel>

          <Panel title="Property details">
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Type" value={property.propertyType} />
              <DetailRow label="Subtype" value={property.propertySubtype} />
              <DetailRow label="Year built" value={property.yearBuilt?.toString()} />
              <DetailRow label="Total area" value={formatSqft(property.totalSqft)} />
              <DetailRow label="Leasable area" value={formatSqft(property.leasableSqft)} />
              <DetailRow
                label="Lot size"
                value={property.lotSizeAcres != null ? `${property.lotSizeAcres} acres` : null}
              />
              <DetailRow label="Units" value={property.unitCount?.toString()} />
              <DetailRow label="Listed" value={formatDate(property.listedAt)} />
              <DetailRow label="Updated" value={formatDate(property.updatedAt)} />
            </dl>
          </Panel>
        </div>
      </div>

      {dealOpen && <CreateDealModal property={property} onClose={() => setDealOpen(false)} />}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

// Skips rows with no value so the details list stays tidy.
function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value.trim() === "" || value === "—") return null;
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function HeroImage({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 sm:h-80">
      {!failed && (
        <img
          src={`https://picsum.photos/seed/${id}/1200/640`}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

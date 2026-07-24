import { useState } from "react";
import { Link } from "react-router-dom";
import type { PropertyResponse } from "../../api/types";
import { formatAddress, formatMoney, formatPercent, formatRate, formatSqft } from "../../lib/format";
import { statusMeta, typeBadgeClasses } from "../../lib/status";

interface Props {
  property: PropertyResponse;
  onStartAcquisition: (property: PropertyResponse) => void;
}

export default function PropertyCard({ property, onStartAcquisition }: Props) {
  const status = statusMeta(property.status);
  const addr = property.address;
  // Already in the pipeline (or closed) — no new deal from here.
  const canStart = property.status === "listed";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/listings/${property.id}`} aria-label={property.title}>
        <CardPhoto id={property.id} statusLabel={status.label} statusDot={status.dot} statusText={status.text} />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/listings/${property.id}`} className="block">
          <h3 className="truncate text-base font-semibold text-slate-900 hover:text-brand" title={property.title}>
            {property.title}
          </h3>
        </Link>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {formatAddress(addr?.street, addr?.city, addr?.state) || "—"}
        </p>

        {property.descriptionText?.trim() && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {property.descriptionText}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClasses(property.propertyType)}`}>
            {property.propertyType}
          </span>
          <span className="text-sm text-slate-500">{formatSqft(property.totalSqft)}</span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
          <dl className="grid grid-cols-3 gap-4">
            <Metric label="Price" value={formatMoney(property.askingPrice)} />
            <Metric label="Cap Rate" value={formatRate(property.capRate)} />
            <Metric label="Occ." value={formatPercent(property.occupancyRate)} />
          </dl>
          <button
            type="button"
            disabled={!canStart}
            title={canStart ? "Create a deal from this listing" : "Only listed properties can start a deal"}
            onClick={() => onStartAcquisition(property)}
            className="shrink-0 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start acquisition
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

// Seeded placeholder image (the list endpoint returns no media yet). Falls back
// to a gradient block if the image service is unreachable.
function CardPhoto({
  id,
  statusLabel,
  statusDot,
  statusText,
}: {
  id: string;
  statusLabel: string;
  statusDot: string;
  statusText: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-44 w-full bg-gradient-to-br from-slate-200 to-slate-300">
      {!failed && (
        <img
          src={`https://picsum.photos/seed/${id}/600/360`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
        <span className={statusText}>{statusLabel}</span>
      </span>
    </div>
  );
}

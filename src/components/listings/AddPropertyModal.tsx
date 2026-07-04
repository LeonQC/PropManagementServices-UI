import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProperty } from "../../api/properties";
import type { CreatePropertyRequest } from "../../api/types";
import { METRO_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "../../lib/filters";
import Modal from "./Modal";

interface Props {
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  propertyType: "",
  propertySubtype: "",
  status: "listed",
  street: "",
  city: "",
  state: "",
  zip: "",
  metroArea: "",
  askingPrice: "",
  capRate: "",
  totalSqft: "",
  occupancyRate: "",
};

type Form = typeof EMPTY_FORM;
type FieldErrors = Partial<Record<keyof Form, string>>;

const REQUIRED: (keyof Form)[] = ["title", "propertyType", "street", "city", "state", "zip"];

export default function AddPropertyModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = (key: keyof Form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: (input: CreatePropertyRequest) => createProperty(input),
    onSuccess: () => {
      // Refetch every cached listings query (any page/filter/sort) so the new
      // property shows up immediately, then close.
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    for (const key of REQUIRED) {
      if (!form[key].trim()) nextErrors[key] = "Required";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(toRequest(form));
  };

  return (
    <Modal title="Add Property" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <Field className="col-span-2" label="Title" required error={errors.title}>
            <TextInput value={form.title} onChange={set("title")} placeholder="Riverside Logistics Center" invalid={!!errors.title} />
          </Field>

          <Field label="Property type" required error={errors.propertyType}>
            <Select value={form.propertyType} onChange={set("propertyType")} invalid={!!errors.propertyType} placeholder="Select type">
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={set("status")}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Subtype">
            <TextInput value={form.propertySubtype} onChange={set("propertySubtype")} placeholder="Warehouse" />
          </Field>

          <Field label="Metro area">
            <Select value={form.metroArea} onChange={set("metroArea")} placeholder="None">
              {METRO_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>

          <Field className="col-span-2" label="Street" required error={errors.street}>
            <TextInput value={form.street} onChange={set("street")} placeholder="8885 Commerce Blvd" invalid={!!errors.street} />
          </Field>

          <Field label="City" required error={errors.city}>
            <TextInput value={form.city} onChange={set("city")} placeholder="Tampa" invalid={!!errors.city} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="State" required error={errors.state}>
              <TextInput value={form.state} onChange={(v) => set("state")(v.toUpperCase().slice(0, 2))} placeholder="FL" invalid={!!errors.state} />
            </Field>
            <Field label="ZIP" required error={errors.zip}>
              <TextInput value={form.zip} onChange={set("zip")} placeholder="33601" invalid={!!errors.zip} />
            </Field>
          </div>

          <Field label="Asking price ($)">
            <NumberInput value={form.askingPrice} onChange={set("askingPrice")} placeholder="1850000" />
          </Field>
          <Field label="Cap rate (%)">
            <NumberInput value={form.capRate} onChange={set("capRate")} placeholder="6.5" />
          </Field>
          <Field label="Total sqft">
            <NumberInput value={form.totalSqft} onChange={set("totalSqft")} placeholder="27100" />
          </Field>
          <Field label="Occupancy (%)">
            <NumberInput value={form.occupancyRate} onChange={set("occupancyRate")} placeholder="94" />
          </Field>
        </div>

        {mutation.isError && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Couldn't create the property. Please try again.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Add Property"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Build the API payload: trim strings, drop blanks to null, convert numbers, and
// turn percent inputs (6.5) into the fractions the service stores (0.065).
function toRequest(form: Form): CreatePropertyRequest {
  return {
    title: form.title.trim(),
    propertyType: form.propertyType,
    propertySubtype: blankToNull(form.propertySubtype),
    status: form.status || null,
    askingPrice: toNumber(form.askingPrice),
    capRate: toFraction(form.capRate),
    totalSqft: toNumber(form.totalSqft),
    occupancyRate: toFraction(form.occupancyRate),
    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip: form.zip.trim(),
      metroArea: blankToNull(form.metroArea),
    },
  };
}

function blankToNull(s: string): string | null {
  return s.trim() === "" ? null : s.trim();
}
function toNumber(s: string): number | null {
  const n = parseFloat(s);
  return s.trim() !== "" && !Number.isNaN(n) ? n : null;
}
function toFraction(s: string): number | null {
  const n = toNumber(s);
  return n == null ? null : n / 100;
}

function Field({
  label,
  required,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1";
const inputOk = "border-slate-200 focus:border-brand focus:ring-brand";
const inputBad = "border-red-400 focus:border-red-500 focus:ring-red-500";

function TextInput({
  value,
  onChange,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${invalid ? inputBad : inputOk}`}
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${inputOk}`}
    />
  );
}

function Select({
  value,
  onChange,
  children,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${invalid ? inputBad : inputOk}`}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

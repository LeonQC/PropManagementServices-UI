// Placeholder for nav destinations whose backends don't exist yet.
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white py-24 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">This area is coming soon.</p>
    </div>
  );
}

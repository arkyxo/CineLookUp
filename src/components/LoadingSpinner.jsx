export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink/50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-crimson-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      {Icon && <Icon size={36} className="text-ink/25" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="max-w-sm text-sm text-ink/50">{subtitle}</p>}
      {action}
    </div>
  );
}

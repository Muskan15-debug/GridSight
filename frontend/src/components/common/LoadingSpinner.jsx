export default function LoadingSpinner({ label = "Loading…", fullScreen = false }) {
  const spinner = (
    <div className="flex items-center gap-3 text-text-secondary">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">{spinner}</div>
  );
}

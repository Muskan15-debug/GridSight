export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-start justify-between gap-4 rounded-md border border-danger bg-danger/10 px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-danger hover:opacity-70"
        >
          ✕
        </button>
      )}
    </div>
  );
}

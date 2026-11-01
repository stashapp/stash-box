import { Button } from "react-bootstrap";

export function QueryError({
  error,
  retry,
  retrying = false,
  showingPrevious = false,
}: {
  error?: { message: string };
  retry: () => Promise<unknown>;
  retrying?: boolean;
  showingPrevious?: boolean;
}) {
  if (!error) return null;
  return (
    <div
      className="alert alert-warning d-flex align-items-center gap-3"
      role="alert"
    >
      <span>
        {error.message}
        {showingPrevious && " Showing previous results."}
      </span>
      <Button
        size="sm"
        onClick={() => {
          void retry().catch(() => undefined);
        }}
        disabled={retrying}
      >
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}

// biome-ignore-all lint/suspicious/noArrayIndexKey: Fixed, stateless placeholder slots never reorder.
import type { ReactNode } from "react";

function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="LoadingSkeleton"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function TextSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="Skeleton-lines">
      {Array.from({ length: lines }, (_, index) => (
        <span
          className="Skeleton-block Skeleton-line"
          style={{
            width: `${index === lines - 1 ? 58 : 92 - (index % 3) * 12}%`,
          }}
          key={`line-${index}`}
        />
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  label = "Loading scenes",
  count = 8,
  portrait = false,
}: {
  label?: string;
  count?: number;
  portrait?: boolean;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="Skeleton-grid">
        {Array.from({ length: count }, (_, index) => (
          <div className="Skeleton-card" key={`card-${index}`}>
            <div
              className={`Skeleton-block Skeleton-thumbnail${portrait ? " Skeleton-portrait" : ""}`}
            />
            <TextSkeleton lines={2} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function ListSkeleton({
  label = "Loading results",
  rows = 4,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="Skeleton-rows">
        {Array.from({ length: rows }, (_, index) => (
          <div className="Skeleton-row" key={`row-${index}`}>
            <span className="Skeleton-block Skeleton-avatar" />
            <TextSkeleton lines={3} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function PageSkeleton({
  kind = "detail",
  label = "Loading page",
}: {
  kind?: "detail" | "performer" | "scene" | "studio";
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className={`Skeleton-header Skeleton-header-${kind}`}>
        {(kind === "performer" || kind === "scene") && (
          <div
            className={`Skeleton-block Skeleton-hero Skeleton-hero-${kind}`}
          />
        )}
        <div className="Skeleton-summary">
          <span className="Skeleton-block Skeleton-heading" />
          <TextSkeleton lines={kind === "performer" ? 7 : 4} />
        </div>
        <div className="Skeleton-actions">
          <span className="Skeleton-block Skeleton-button" />
          <span className="Skeleton-block Skeleton-button" />
        </div>
      </div>
      <div className="Skeleton-tabs">
        <span className="Skeleton-block" />
        <span className="Skeleton-block" />
        <span className="Skeleton-block" />
      </div>
      {kind === "performer" || kind === "studio" ? (
        <CardGridSkeleton count={4} />
      ) : (
        <TextSkeleton lines={6} />
      )}
    </LoadingRegion>
  );
}

export function AppSkeleton() {
  return (
    <div className="Skeleton-app">
      <div className="Skeleton-navbar" aria-hidden="true">
        <span className="Skeleton-block" />
        <span className="Skeleton-block" />
        <span className="Skeleton-block" />
      </div>
      <div className="MainContent container-fluid">
        <div className="NarrowPage">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}

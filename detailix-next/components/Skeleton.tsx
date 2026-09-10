interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = "100%", height = "1rem", borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ""}`}
      style={{ width, height, borderRadius: borderRadius ?? "var(--radius-sm)" }}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="tile" aria-hidden>
      <div className="tile-media">
        <Skeleton height="100%" borderRadius="0" />
      </div>
      <div className="tile-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <Skeleton height="0.7rem" width="40%" />
        <Skeleton height="1rem" width="80%" />
        <Skeleton height="0.9rem" width="50%" />
        <Skeleton height="1.5rem" width="30%" />
      </div>
    </div>
  );
}

interface Props {
  data: number[]; // sequence of positions (newest last)
  width?: number;
  height?: number;
}

/**
 * Tiny SVG sparkline showing position evolution.
 * Lower is better (position 1 at top). Colored by trend.
 */
export function MiniSparkline({ data, width = 80, height = 24 }: Props) {
  if (!data || data.length < 2) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const max = Math.max(...data, 10);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const stepX = width / (data.length - 1);

  // Invert Y: lower position = higher on chart
  const points = data
    .map((v, i) => `${i * stepX},${((v - min) / range) * (height - 4) + 2}`)
    .join(" ");

  const first = data[0];
  const last = data[data.length - 1];
  const trendColor =
    last < first
      ? "stroke-emerald-500"
      : last > first
      ? "stroke-rose-500"
      : "stroke-muted-foreground";

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        fill="none"
        strokeWidth="1.5"
        className={trendColor}
        points={points}
      />
    </svg>
  );
}
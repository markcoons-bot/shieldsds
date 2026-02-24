"use client";

interface StatusDotProps {
  status: "green" | "amber" | "red" | "high" | "medium" | "low";
  size?: "sm" | "md";
}

const colorMap: Record<string, string> = {
  green: "bg-status-green",
  amber: "bg-status-amber",
  red: "bg-status-red",
  high: "bg-status-red",
  medium: "bg-status-amber",
  low: "bg-blue-400",
};

export default function StatusDot({ status, size = "md" }: StatusDotProps) {
  const sizeClass = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${colorMap[status]}`}
    />
  );
}

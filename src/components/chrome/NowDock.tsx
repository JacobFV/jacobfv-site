"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  building: string;
  reading?: string;
  updated: string;
};

// Bottom-left corner widget. Hides on /loop and on vision detail pages
// (the 3D room owns the bottom-left at that point).
export function NowDock({ building, reading, updated }: Props) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/loop") ||
    pathname.startsWith("/focus-statement") // sceneId-mounted vision
  )
    return null;

  return (
    <Link
      href="/now"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 280,
        background: "rgba(14, 16, 20, 0.78)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-bg-2)",
        borderRadius: 6,
        padding: "12px 14px",
        textDecoration: "none",
        color: "var(--color-ink)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        zIndex: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--color-ink-mute)",
          marginBottom: 6,
        }}
      >
        <span style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
          now
        </span>
        <span>{updated}</span>
      </div>
      <div style={{ color: "var(--color-ink)", fontSize: 12, lineHeight: 1.4 }}>
        <span style={{ color: "var(--color-ink-mute)" }}>building </span>
        {building}
      </div>
      {reading && (
        <div
          style={{
            color: "var(--color-ink)",
            fontSize: 12,
            lineHeight: 1.4,
            marginTop: 2,
          }}
        >
          <span style={{ color: "var(--color-ink-mute)" }}>reading </span>
          {reading}
        </div>
      )}
    </Link>
  );
}

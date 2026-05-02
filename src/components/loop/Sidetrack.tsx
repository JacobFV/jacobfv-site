import Link from "next/link";
import type { ReactNode } from "react";

// Phase 6: Sidetrack is an inline aside that links to a node in the main
// graph. The "open as popover without leaving" interaction is Phase 8
// polish — for now, the link opens the node in a new tab so the
// reader's scroll position survives.
export function Sidetrack({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <aside
      style={{
        maxWidth: 640,
        margin: "8vh auto",
        padding: "20px 24px",
        borderLeft: "3px solid #1c53bd",
        background: "rgba(28, 83, 189, 0.04)",
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-ink-mute)",
          marginBottom: 8,
        }}
      >
        Sidetrack
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>{children}</div>
      <div style={{ marginTop: 12 }}>
        <Link
          href={`/${to}`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#1c53bd",
            textDecoration: "none",
          }}
        >
          → /{to}
        </Link>
      </div>
    </aside>
  );
}

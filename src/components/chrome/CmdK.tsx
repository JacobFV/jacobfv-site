"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import type { Lane, NodeKind } from "@/lib/graph";

type SearchableNode = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  lane: Lane;
  kind: NodeKind;
  date: string;
};

type Props = {
  nodes: SearchableNode[];
};

const laneColor: Record<Lane, string> = {
  research: "var(--color-lane-research)",
  building: "var(--color-lane-building)",
  writing: "var(--color-lane-writing)",
  personal: "var(--color-lane-personal)",
};

export function CmdK({ nodes }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(nodes, {
        keys: [
          { name: "title", weight: 2 },
          { name: "tags", weight: 1.2 },
          { name: "summary", weight: 0.8 },
        ],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [nodes],
  );

  const results = useMemo(() => {
    if (!query) {
      return [...nodes]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 8);
    }
    return fuse.search(query, { limit: 12 }).map((r) => r.item);
  }, [query, fuse, nodes]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return <CmdHint />;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(4, 5, 10, 0.55)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: "calc(100% - 48px)",
          background: "var(--color-bg-1)",
          border: "1px solid var(--color-bg-2)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Command label="Site search" shouldFilter={false}>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Search nodes, jump to a mode, …"
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "transparent",
              border: 0,
              borderBottom: "1px solid var(--color-bg-2)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              outline: "none",
            }}
          />
          <Command.List
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: 8,
            }}
          >
            <Command.Empty
              style={{
                padding: 16,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--color-ink-mute)",
              }}
            >
              Nothing matches.
            </Command.Empty>

            <Command.Group
              heading="Nodes"
              style={
                {
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-ink-mute)",
                  padding: "4px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                } as React.CSSProperties
              }
            >
              {results.map((n) => (
                <Command.Item
                  key={n.id}
                  value={`${n.title} ${n.tags.join(" ")} ${n.kind}`}
                  onSelect={() => go(`/${n.id}`)}
                  style={
                    {
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "var(--color-ink)",
                      fontSize: 14,
                    } as React.CSSProperties
                  }
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: laneColor[n.lane],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{n.title}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-mute)",
                    }}
                  >
                    {n.kind}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Actions"
              style={
                {
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-ink-mute)",
                  padding: "4px 8px",
                  marginTop: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                } as React.CSSProperties
              }
            >
              <ActionItem
                label="Open most recent post"
                onSelect={() => {
                  const recent = [...nodes]
                    .filter((n) => n.kind === "post")
                    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
                  if (recent) go(`/${recent.id}`);
                }}
              />
              <ActionItem
                label="Switch to constellation"
                onSelect={() => go("/")}
              />
              <ActionItem
                label="Switch to timeline (coming in Phase 5)"
                disabled
                onSelect={() => undefined}
              />
              <ActionItem
                label="Open the now dock"
                onSelect={() => go("/now")}
              />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function ActionItem({
  label,
  onSelect,
  disabled,
}: {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Command.Item
      onSelect={disabled ? () => undefined : onSelect}
      disabled={disabled}
      style={
        {
          padding: "10px 12px",
          borderRadius: 4,
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "var(--color-ink-mute)" : "var(--color-ink)",
          fontSize: 14,
        } as React.CSSProperties
      }
    >
      {label}
    </Command.Item>
  );
}

function CmdHint() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--color-ink-mute)",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      <kbd
        style={{
          padding: "2px 6px",
          border: "1px solid var(--color-bg-2)",
          borderRadius: 3,
          marginRight: 4,
          background: "var(--color-bg-1)",
          fontFamily: "inherit",
        }}
      >
        ⌘K
      </kbd>
      to search
    </div>
  );
}

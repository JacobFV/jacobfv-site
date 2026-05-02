// Renders Velite-compiled MDX. `s.mdx()` ships a JS module string; we
// evaluate it against react/jsx-runtime to get the React component.

import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";
import { readerComponents } from "@/components/reader/components";

type MDXModule = {
  default: ComponentType<{ components?: Record<string, ComponentType> }>;
};

const sharedComponents: Record<string, ComponentType> = {
  // Typography map; Phase 6 will add <Scene>, <Figure>, <Sidetrack> for
  // /loop chapters.
  ...readerComponents,
};

function compile(code: string): ComponentType<{
  components?: Record<string, ComponentType>;
}> | null {
  if (!code || !code.trim()) return null;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(code);
  const mod = fn({ ...runtime }) as MDXModule | undefined;
  if (!mod || typeof mod.default !== "function") return null;
  return mod.default;
}

export function MDXContent({
  code,
  components,
}: {
  code: string;
  components?: Record<string, ComponentType>;
}) {
  const Component = compile(code);
  if (!Component) return null;
  return (
    <Component components={{ ...sharedComponents, ...(components ?? {}) }} />
  );
}

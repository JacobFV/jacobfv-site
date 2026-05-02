// Renders Velite-compiled MDX. `s.mdx()` ships a JS module string; we
// evaluate it against react/jsx-runtime to get the React component.

import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";

type MDXModule = {
  default: ComponentType<{ components?: Record<string, ComponentType> }>;
};

const sharedComponents: Record<string, ComponentType> = {
  // Phase-specific MDX components (Scene, Figure, Sidetrack) are added in
  // later phases. Phase 1 renders the bare MDX with default elements.
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

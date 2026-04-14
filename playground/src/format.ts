type HookName = "useAnimateOnMount" | "useAnimateOnAction" | "useAnimateOnChange";

type FormatOpts = {
  from?: number | number[];
  durationMs: number;
  easingSnippet: string;
};

const formatValue = (v: number | number[]): string =>
  Array.isArray(v) ? `[${v.join(", ")}]` : String(v);

export const formatCallSite = (
  hookName: HookName,
  value: number | number[],
  opts: FormatOpts,
): string => {
  const lines: string[] = [];
  lines.push(`import { ${hookName}, Easings } from "re-animate-js";`);
  lines.push("");

  const optEntries: string[] = [];
  if (hookName !== "useAnimateOnChange" && opts.from !== undefined) {
    optEntries.push(`  from: ${formatValue(opts.from)},`);
  }
  optEntries.push(`  durationMs: ${opts.durationMs},`);
  optEntries.push(`  easingFunction: ${opts.easingSnippet},`);

  const lhs =
    hookName === "useAnimateOnAction"
      ? "const { animatedValue, isAnimating, trigger }"
      : "const { animatedValue }";

  lines.push(`${lhs} = ${hookName}(`);
  lines.push(`  ${formatValue(value)},`);
  lines.push("  {");
  for (const entry of optEntries) lines.push(entry);
  lines.push("  },");
  lines.push(");");

  return lines.join("\n");
};

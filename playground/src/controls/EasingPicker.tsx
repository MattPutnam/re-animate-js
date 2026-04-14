import { type EasingFunction, Easings } from "re-animate-js";

type Variant = "in" | "out" | "inOut";
const variants: Variant[] = ["in", "out", "inOut"];

type CatalogEntry = { name: string; label: string; fn: EasingFunction; snippet: string };

const buildCatalog = (): CatalogEntry[] => {
  const entries: CatalogEntry[] = [
    { name: "linear", label: "Linear", fn: Easings.linear, snippet: "Easings.linear" },
  ];
  const labelOf = (variant: Variant) =>
    variant === "in" ? "in" : variant === "out" ? "out" : "in-out";

  const addFamily = (
    key: string,
    family: { in: EasingFunction; out: EasingFunction; inOut: EasingFunction },
    snippetBase: string,
    displayBase: string,
  ) => {
    for (const v of variants) {
      entries.push({
        name: `${key}.${v}`,
        label: `${displayBase} (${labelOf(v)})`,
        fn: family[v],
        snippet: `${snippetBase}.${v}`,
      });
    }
  };

  addFamily("sine", Easings.sine, "Easings.sine", "Sine");
  addFamily("quadratic", Easings.polynomial(2), "Easings.polynomial(2)", "Quadratic");
  addFamily("cubic", Easings.polynomial(3), "Easings.polynomial(3)", "Cubic");
  addFamily("quartic", Easings.polynomial(4), "Easings.polynomial(4)", "Quartic");
  addFamily("exponential", Easings.exponential, "Easings.exponential", "Exponential");
  addFamily("circular", Easings.circular, "Easings.circular", "Circular");
  addFamily("back", Easings.back, "Easings.back", "Back");
  addFamily("elastic", Easings.elastic, "Easings.elastic", "Elastic");
  addFamily("bounce", Easings.bounce, "Easings.bounce", "Bounce");

  return entries;
};

const catalog = buildCatalog();
const byName = new Map(catalog.map((e) => [e.name, e]));

type Props = {
  value: string;
  onChange: (name: string, fn: EasingFunction, snippet: string) => void;
};

export const EasingPicker = ({ value, onChange }: Props) => (
  <div className="control">
    <label>Easing</label>
    <select
      value={value}
      onChange={(e) => {
        const entry = byName.get(e.target.value)!;
        onChange(entry.name, entry.fn, entry.snippet);
      }}
    >
      {catalog.map((e) => (
        <option key={e.name} value={e.name}>
          {e.label}
        </option>
      ))}
    </select>
  </div>
);

import { type EasingFunction, useAnimateOnChange } from "re-animate-js";
import { useState } from "react";

import { CodeSnippet } from "../controls/CodeSnippet";
import { EasingPicker } from "../controls/EasingPicker";
import { NumberArrayInput } from "../controls/NumberArrayInput";
import { NumberSlider } from "../controls/NumberSlider";
import { ShapeToggle } from "../controls/ShapeToggle";
import { formatCallSite } from "../format";
import { Bars } from "../visualize/Bars";

const ScalarRunner = ({
  value,
  durationMs,
  easingFunction,
}: {
  value: number;
  durationMs: number;
  easingFunction: EasingFunction;
}) => {
  const { animatedValue } = useAnimateOnChange(value, { durationMs, easingFunction });
  return <Bars values={animatedValue} />;
};

const ArrayRunner = ({
  value,
  durationMs,
  easingFunction,
}: {
  value: number[];
  durationMs: number;
  easingFunction: EasingFunction;
}) => {
  const { animatedValue } = useAnimateOnChange(value, { durationMs, easingFunction });
  return <Bars values={animatedValue} />;
};

export const ChangeDemo = () => {
  const [shape, setShape] = useState<"scalar" | "array">("scalar");
  const [arrayLength, setArrayLength] = useState(4);
  const [scalarValue, setScalarValue] = useState(150);
  const [arrayValue, setArrayValue] = useState<number[]>([40, 80, 120, 160]);
  const [durationMs, setDurationMs] = useState(800);
  const [easingName, setEasingName] = useState("sine.inOut");
  const [easingFn, setEasingFn] = useState<EasingFunction>(() => (x: number) => Math.sin((x * Math.PI) / 2));
  const [easingSnippet, setEasingSnippet] = useState("Easings.sine.inOut");
  const [remountKey, setRemountKey] = useState(0);

  const value = shape === "scalar" ? scalarValue : arrayValue;
  const code = formatCallSite("useAnimateOnChange", value, { durationMs, easingSnippet });

  const onShapeChange = (next: "scalar" | "array") => {
    setShape(next);
    setRemountKey((k) => k + 1);
  };
  const onLengthChange = (n: number) => {
    const clamped = Math.max(1, Math.min(8, n));
    setArrayLength(clamped);
    setArrayValue((prev) => Array.from({ length: clamped }, (_, i) => prev[i] ?? 100));
    setRemountKey((k) => k + 1);
  };

  return (
    <main className="demo">
      <section className="controls">
        <h2>Controls (animations fire on value change)</h2>
        <ShapeToggle shape={shape} onChange={onShapeChange} />
        {shape === "array" && (
          <NumberSlider label="Array length" value={arrayLength} onChange={onLengthChange} min={1} max={8} />
        )}
        {shape === "scalar" ? (
          <NumberSlider label="value" value={scalarValue} onChange={setScalarValue} />
        ) : (
          <NumberArrayInput label="value" values={arrayValue} onChange={setArrayValue} />
        )}
        <NumberSlider label="durationMs" value={durationMs} onChange={setDurationMs} min={0} max={3000} step={50} />
        <EasingPicker
          value={easingName}
          onChange={(name, fn, snippet) => {
            setEasingName(name);
            setEasingFn(() => fn);
            setEasingSnippet(snippet);
          }}
        />
      </section>
      <section className="viz">
        <h2>Animation</h2>
        {shape === "scalar" ? (
          <ScalarRunner key={remountKey} value={scalarValue} durationMs={durationMs} easingFunction={easingFn} />
        ) : (
          <ArrayRunner key={remountKey} value={arrayValue} durationMs={durationMs} easingFunction={easingFn} />
        )}
      </section>
      <section className="snippet">
        <h2>Code</h2>
        <CodeSnippet code={code} />
      </section>
    </main>
  );
};

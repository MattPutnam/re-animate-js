import { type EasingFunction, useAnimateOnMount } from "re-animate-js";
import { useState } from "react";

import { CodeSnippet } from "../controls/CodeSnippet";
import { EasingPicker } from "../controls/EasingPicker";
import { NumberArrayInput } from "../controls/NumberArrayInput";
import { NumberSlider } from "../controls/NumberSlider";
import { ShapeToggle } from "../controls/ShapeToggle";
import { formatCallSite } from "../format";
import { Bars } from "../visualize/Bars";

type RunnerProps = {
  value: number | number[];
  from: number | number[];
  durationMs: number;
  easingFunction: EasingFunction;
};

const ScalarRunner = ({ value, from, durationMs, easingFunction }: RunnerProps & { value: number; from: number }) => {
  const { animatedValue } = useAnimateOnMount(value, { from, durationMs, easingFunction });
  return <Bars values={animatedValue} />;
};

const ArrayRunner = ({ value, from, durationMs, easingFunction }: RunnerProps & { value: number[]; from: number[] }) => {
  const { animatedValue } = useAnimateOnMount(value, { from, durationMs, easingFunction });
  return <Bars values={animatedValue} />;
};

export const MountDemo = () => {
  const [shape, setShape] = useState<"scalar" | "array">("scalar");
  const [arrayLength, setArrayLength] = useState(4);
  const [scalarValue, setScalarValue] = useState(150);
  const [scalarFrom, setScalarFrom] = useState(0);
  const [arrayValue, setArrayValue] = useState<number[]>([40, 80, 120, 160]);
  const [arrayFrom, setArrayFrom] = useState<number[]>([0, 0, 0, 0]);
  const [durationMs, setDurationMs] = useState(800);
  const [easingName, setEasingName] = useState("sine.inOut");
  const [easingFn, setEasingFn] = useState<EasingFunction>(() => {
    // Use a placeholder; EasingPicker will hand us the real fn on first change.
    return (x: number) => Math.sin((x * Math.PI) / 2);
  });
  const [easingSnippet, setEasingSnippet] = useState("Easings.sine.inOut");
  const [remountKey, setRemountKey] = useState(0);

  const value = shape === "scalar" ? scalarValue : arrayValue;
  const from = shape === "scalar" ? scalarFrom : arrayFrom;

  const code = formatCallSite("useAnimateOnMount", value, { from, durationMs, easingSnippet });

  const onShapeChange = (next: "scalar" | "array") => {
    setShape(next);
    setRemountKey((k) => k + 1);
  };

  const onLengthChange = (n: number) => {
    const clamped = Math.max(1, Math.min(8, n));
    setArrayLength(clamped);
    setArrayValue((prev) => Array.from({ length: clamped }, (_, i) => prev[i] ?? 100));
    setArrayFrom((prev) => Array.from({ length: clamped }, (_, i) => prev[i] ?? 0));
    setRemountKey((k) => k + 1);
  };

  return (
    <main className="demo">
      <section className="controls">
        <h2>Controls</h2>
        <ShapeToggle shape={shape} onChange={onShapeChange} />
        {shape === "array" && (
          <NumberSlider
            label="Array length"
            value={arrayLength}
            onChange={onLengthChange}
            min={1}
            max={8}
          />
        )}
        {shape === "scalar" ? (
          <>
            <NumberSlider label="value" value={scalarValue} onChange={setScalarValue} />
            <NumberSlider label="from" value={scalarFrom} onChange={setScalarFrom} />
          </>
        ) : (
          <>
            <NumberArrayInput label="value" values={arrayValue} onChange={setArrayValue} />
            <NumberArrayInput label="from" values={arrayFrom} onChange={setArrayFrom} />
          </>
        )}
        <NumberSlider
          label="durationMs"
          value={durationMs}
          onChange={setDurationMs}
          min={0}
          max={3000}
          step={50}
        />
        <EasingPicker
          value={easingName}
          onChange={(name, fn, snippet) => {
            setEasingName(name);
            setEasingFn(() => fn);
            setEasingSnippet(snippet);
          }}
        />
        <div className="button-row">
          <button onClick={() => setRemountKey((k) => k + 1)}>Remount</button>
        </div>
      </section>
      <section className="viz">
        <h2>Animation</h2>
        {shape === "scalar" ? (
          <ScalarRunner
            key={remountKey}
            value={scalarValue}
            from={scalarFrom}
            durationMs={durationMs}
            easingFunction={easingFn}
          />
        ) : (
          <ArrayRunner
            key={remountKey}
            value={arrayValue}
            from={arrayFrom}
            durationMs={durationMs}
            easingFunction={easingFn}
          />
        )}
      </section>
      <section className="snippet">
        <h2>Code</h2>
        <CodeSnippet code={code} />
      </section>
    </main>
  );
};

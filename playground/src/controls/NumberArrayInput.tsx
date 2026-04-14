import { NumberSlider } from "./NumberSlider";

type Props = {
  label: string;
  values: number[];
  onChange: (next: number[]) => void;
  min?: number;
  max?: number;
};

export const NumberArrayInput = ({ label, values, onChange, min, max }: Props) => (
  <>
    {values.map((v, i) => (
      <NumberSlider
        key={i}
        label={`${label}[${i}]`}
        value={v}
        min={min}
        max={max}
        onChange={(n) => {
          const next = values.slice();
          next[i] = n;
          onChange(next);
        }}
      />
    ))}
  </>
);

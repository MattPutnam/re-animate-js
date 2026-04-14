type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export const NumberSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
}: Props) => (
  <div className="control">
    <label>{label}</label>
    <div className="row">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  </div>
);

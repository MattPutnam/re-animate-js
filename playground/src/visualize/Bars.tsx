type Props = {
  values: number | number[];
  max?: number;
};

export const Bars = ({ values, max = 200 }: Props) => {
  const arr = Array.isArray(values) ? values : [values];
  const safeMax = Math.max(max, 1);
  return (
    <div className="bars">
      {arr.length === 0 && (
        <div className="bar-readout" style={{ width: "auto" }}>
          (empty array — nothing to animate)
        </div>
      )}
      {arr.map((v, i) => {
        const pct = Math.max(0, Math.min(100, (v / safeMax) * 100));
        return (
          <div className="bar-row" key={i}>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-readout">{v.toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  );
};

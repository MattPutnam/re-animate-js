type Shape = "scalar" | "array";

type Props = {
  shape: Shape;
  onChange: (shape: Shape) => void;
};

export const ShapeToggle = ({ shape, onChange }: Props) => (
  <div className="shape-toggle">
    <button
      className={shape === "scalar" ? "active" : ""}
      onClick={() => onChange("scalar")}
    >
      Scalar
    </button>
    <button
      className={shape === "array" ? "active" : ""}
      onClick={() => onChange("array")}
    >
      Array
    </button>
  </div>
);

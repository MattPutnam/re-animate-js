type ProgressBarProps = {
  percentage: number;
}

export const ProgressBar = ({ percentage }: ProgressBarProps) => {
  return (
    <div style={{
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${percentage}%`,
        backgroundColor: "darkgreen"
      }}>
      </div>
    </div>
  );
}

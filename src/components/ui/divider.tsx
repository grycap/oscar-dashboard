import { OscarStyles } from "@/styles";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
}

const Divider = ({ orientation = "horizontal" }: DividerProps) => {
  return (
    <div
      style={{
        width: orientation === "horizontal" ? "100%" : "1px",
        height: orientation === "horizontal" ? "1px" : "100%",
        borderTop: OscarStyles.border,
      }}
    ></div>
  );
};

export default Divider;

import OscarColors from "@/styles";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
}

const Divider = ({ orientation = "horizontal" }: DividerProps) => {
  const isHorizontal = orientation === "horizontal";
  return (
    <div
      style={{
        width: isHorizontal ? "100%" : "1px",
        height: isHorizontal ? "1px" : "100%",
        backgroundColor: OscarColors.Gray2,
      }}
    ></div>
  );
};

export default Divider;

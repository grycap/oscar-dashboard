import { useMatch, useNavigate } from "react-router-dom";
import "./style.css";
import OscarColors, { ColorWithOpacity } from "@/styles";

interface Props {
  path: string;
  label: string;
  icon: React.ReactNode;
}

function SidebarRouteItem({ path, label, icon }: Props) {
  const baseRoute = "/ui";
  const match = useMatch(baseRoute + path);
  const navigate = useNavigate();

  const isActive = match !== null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        width: "100%",
        position: "relative",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            width: "7px",
            height: "20px",
            backgroundColor: OscarColors.Green1,
            borderRadius: "0 4px 4px 0",
            top: 5,
            left: 0,
          }}
        ></div>
      )}
      <div
        className="sidebar-item"
        style={{
          width: "163px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderRadius: "4px",
          height: "30px",
          background: isActive ? ColorWithOpacity("#D4D4D4", 0.3) : "inherit",
          padding: "0 8px",
          gap: "8px",
          cursor: "pointer",
        }}
        onClick={() => {
          navigate(baseRoute + path);
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

export default SidebarRouteItem;

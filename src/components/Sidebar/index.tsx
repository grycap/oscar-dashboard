import OscarLogo from "@/assets/oscar-big.png";
import SidebarRouteItem from "./components/SidebarRotueItem";
import { Codesandbox, Database } from "lucide-react";

function Sidebar() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "200px",
        paddingTop: "10px",
      }}
    >
      <img src={OscarLogo} alt="Oscar logo" width={163} />
      <ul
        style={{
          marginTop: "40px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SidebarRouteItem
          path="/services"
          label="Services"
          icon={<Codesandbox size={20} />}
        />
        <SidebarRouteItem
          path="/minio"
          label="Minio"
          icon={<Database size={20} />}
        />
      </ul>
    </section>
  );
}

export default Sidebar;

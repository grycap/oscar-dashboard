import OscarLogo from "@/assets/oscar-big.png";
import SidebarRouteItem from "./components/SidebarRotueItem";
import { Codesandbox, Database, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import OscarColors, { OscarStyles } from "@/styles";
import { useAuth } from "@/contexts/AuthContext";

function Sidebar() {
  const authContext = useAuth();

  function handleLogout() {
    authContext.setAuthData({
      user: "",
      password: "",
      endpoint: "",
      authenticated: false,
    });
  }
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
      <div
        style={{
          marginTop: "auto",
          height: "50px",
          borderTop: OscarStyles.border,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          gap: "16px",
          cursor: "pointer",
        }}
        onClick={handleLogout}
      >
        Log out <LogOut color={OscarColors.Red} />
      </div>
    </section>
  );
}

export default Sidebar;

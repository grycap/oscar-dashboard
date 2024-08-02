import Sidebar from "@/components/Sidebar";
import OscarColors, { ColorWithOpacity } from "@/styles";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function AppLayout() {
  const location = useLocation();

  if (location.pathname === "/ui") {
    return <Navigate to="/ui/services" replace />;
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
      }}
    >
      <Sidebar />
      <section
        style={{
          flex: 1,
          marginTop: 10,
          borderTopLeftRadius: 8,
          background: ColorWithOpacity(OscarColors.Gray1, 0.5),
          border: `1px solid ${OscarColors.Gray2}`,
        }}
      >
        <Outlet />
      </section>
    </main>
  );
}

export default AppLayout;

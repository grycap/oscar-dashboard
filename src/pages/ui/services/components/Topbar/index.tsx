import OscarColors, { OscarStyles } from "@/styles";
import UserInfo from "./components/UserInfo";
import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import ServicesFilterBy from "./components/FilterBy";
import ServicesOrderBy from "./components/OrderBy";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

enum TopbarMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  const mode = useMemo(() => {
    if (!serviceId) {
      return TopbarMode.List;
    }

    if (serviceId === "create") {
      return TopbarMode.Create;
    }

    return TopbarMode.Update;
  }, [pathnames]);

  return (
    <div
      style={{
        height: "64px",
        borderBottom: OscarStyles.border,
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <ServiceBreadcrumb />
        {mode === TopbarMode.List && (
          <>
            <ServicesFilterBy />
            <ServicesOrderBy />
            <Button
              style={{
                background: OscarColors.Green4,
              }}
            >
              <Plus className="mr-2 h-5 w-5" /> Create service
            </Button>
          </>
        )}
      </div>
      <UserInfo />
    </div>
  );
}

export default ServicesTopbar;

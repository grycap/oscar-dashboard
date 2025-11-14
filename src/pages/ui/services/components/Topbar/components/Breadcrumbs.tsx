import OscarColors from "@/styles";
import { Link, useLocation } from "react-router-dom";

function ServiceBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
      }}
    >
      {serviceId === "create" && (
        <>
          <span style={{ color: OscarColors.DarkGrayText, fontSize: 18 }}>
            {` > `}
          </span>
          <Link
            to="/ui/services/create"
            style={{
              color: "black",
              fontSize: 18,
              textDecoration: "none",
            }}
          >{`Creating service`}</Link>
        </>
      )}
    </div>
  );
}

export default ServiceBreadcrumb;

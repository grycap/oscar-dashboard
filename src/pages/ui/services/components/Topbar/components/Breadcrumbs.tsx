import OscarColors from "@/styles";
import { Link, useLocation } from "react-router-dom";

function ServiceBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  console.log(serviceId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Link
        to="/ui/services"
        style={{
          color: OscarColors.DarkGrayText,
          fontSize: 18,
          textDecoration: "none",
        }}
      >{`Services`}</Link>
    </div>
  );
}

export default ServiceBreadcrumb;

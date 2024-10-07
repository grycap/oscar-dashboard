import OscarColors, { OscarStyles } from "@/styles";
import { useParams, Link } from "react-router-dom";
import UserInfo from "@/components/UserInfo";

function MinioTopbar() {
  const { name, folderPath = "" } = useParams();
  const pathSegments = folderPath ? folderPath.split("/") : [];
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = pathSegments.slice(0, index + 1).join("/");
    return (
      <Link key={index} to={`/ui/minio/${name}/${path}`}>
        {segment}
      </Link>
    );
  });

  /* const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames; */

  /*  const mode = useMemo(() => {
    if (!serviceId) {
      return ServiceViewMode.List;
    }

    if (serviceId === "create") {
      return ServiceViewMode.Create;
    }

    return ServiceViewMode.Update;
  }, [pathnames]); */

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
          gap: 10,
        }}
      >
        <h1
          style={{
            color: OscarColors.DarkGrayText,
            fontSize: 18,
            textDecoration: "none",
          }}
        >
          Bucket:{" "}
          <span style={{ fontWeight: "bold", color: "black" }}>{name}</span>
        </h1>
        <nav>{breadcrumbs.length > 0 && <div>{breadcrumbs}</div>}</nav>
        {/* <ServiceBreadcrumb />

        {mode === ServiceViewMode.List ? (
          <>
            <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <ServicesFilterBy />
              <ServicesOrderBy />
            </div>
            <AddServiceButton />
          </>
        ) : (
          <CreateUpdateServiceTabs mode={mode} />
        )} */}
      </div>
      <UserInfo />
    </div>
  );
}

export default MinioTopbar;

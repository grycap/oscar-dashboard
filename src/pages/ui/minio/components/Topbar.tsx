import OscarColors, { OscarStyles } from "@/styles";
import { Link } from "react-router-dom";
import UserInfo from "@/components/UserInfo";
import AddBucketButton from "./AddBucketButton";
import AddFolderButton from "./AddFolderButton";
import useSelectedBucket from "../hooks/useSelectedBucket";
import { ChevronRight } from "lucide-react";

function MinioTopbar() {
  const { name, path } = useSelectedBucket();
  const pathSegments = path ? path.split("/").filter((segment) => segment) : [];

  const isOnRoot = name === undefined;

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = pathSegments.slice(0, index + 1).join("/");

    return (
      <>
        <ChevronRight className="pt-[2px]" />
        <Link key={index} to={`/ui/minio/${name}/${path}`}>
          {segment}
        </Link>
      </>
    );
  });

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
        <div className="flex flex-row items-center gap-1">
          <h1
            style={{
              color: OscarColors.DarkGrayText,
              fontSize: 18,
              textDecoration: "none",
            }}
          >
            {isOnRoot ? (
              <span>Buckets</span>
            ) : (
              <>
                <span className="mr-2">Bucket:</span>
                <Link
                  to={`/ui/minio/${name}`}
                  style={{
                    fontWeight: "bold",
                    color: "black",
                  }}
                >
                  {name}
                </Link>
              </>
            )}
          </h1>
          <nav className="flex flex-row items-center gap-1">
            {breadcrumbs.length > 0 && <>{breadcrumbs}</>}
          </nav>
        </div>
        {isOnRoot && <AddBucketButton />}
        {!isOnRoot && <AddFolderButton />}
      </div>
      <UserInfo />
    </div>
  );
}

export default MinioTopbar;

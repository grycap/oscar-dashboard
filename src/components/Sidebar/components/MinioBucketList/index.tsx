import OscarColors from "@/styles";
import { Link, useLocation, useParams } from "react-router-dom";
import "./styles.css";
import { useMinio } from "@/contexts/Minio/MinioContext";

export function MinioBucketList() {
  const { buckets } = useMinio();
  const location = useLocation();

  const isActive = location.pathname.includes("/minio");
  const params = useParams();
  const activeItem = Object.values(params)?.pop();

  if (!isActive) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflowY: "auto",
        gap: "6px",
      }}
    >
      {buckets.map((bucket) => (
        <Link
          to={`/ui/minio/${bucket.Name}`}
          className="minio-bucket-list-item"
          key={bucket.Name}
          style={{
            height: "22px",
            padding: "0px 10px",
            margin: "0px 10px",
            borderRadius: "4px",
            fontSize: "14px",
            color:
              activeItem === bucket.Name ? "black" : OscarColors.DarkGrayText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: "none",
            lineHeight: "22px",
            fontWeight: activeItem === bucket.Name ? "bold" : "normal",
          }}
        >
          {bucket.Name}
        </Link>
      ))}
    </div>
  );
}

import OscarColors from "@/styles";
import { Link, useLocation, useParams } from "react-router-dom";
import "./styles.css";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Button } from "@/components/ui/button";
import { FolderPlus, Save } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function MinioBucketList() {
  const { buckets, createBucket } = useMinio();
  const location = useLocation();

  const isActive = location.pathname.includes("/minio");
  const params = useParams();
  const activeItem = Object.values(params)?.pop();
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");

  function handleCreateBucket() {
    createBucket(newBucketName);
    setIsCreatingBucket(false);
    setNewBucketName("");
  }

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
      {!isCreatingBucket && (
        <Button
          variant="ghost"
          size="sm"
          style={{ margin: "0px 10px" }}
          onClick={() => setIsCreatingBucket(true)}
        >
          + New bucket
        </Button>
      )}
      {isCreatingBucket && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "6px",
            alignItems: "center",
            margin: "0px 10px",
          }}
        >
          <Input
            placeholder="Bucket name"
            value={newBucketName}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateBucket();
              }
            }}
            onBlur={() => setIsCreatingBucket(false)}
            onChange={(e) => setNewBucketName(e.target.value)}
          />
          <Button variant="ghost" size="icon" onClick={handleCreateBucket}>
            <Save color={OscarColors.Green4} />
          </Button>
        </div>
      )}
    </div>
  );
}

import { useMinio } from "@/contexts/Minio/MinioContext";
import { _Object, CommonPrefix } from "@aws-sdk/client-s3";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import GenericTable from "@/components/Table"; // Importar GenericTable
import { Folder } from "lucide-react";

type BucketItem =
  | {
      Name: string;
      Type: "folder";
      Key: CommonPrefix;
    }
  | {
      Name: string;
      Type: "file";
      Key: _Object;
    };

export default function BucketList() {
  const { name: bucketName, ...rest } = useParams();
  const folderPath = Object.values(rest)?.pop?.() ?? "";

  const { getBucketItems, buckets } = useMinio();

  const [items, setItems] = useState<BucketItem[]>([]);

  useEffect(() => {
    if (bucketName) {
      getBucketItems(bucketName, folderPath).then(({ items, folders }) => {
        const combinedItems = [
          ...(folders?.map((folder) => {
            const path = folder.Prefix?.split("/");
            const name = path?.[path.length - 2] || "";
            const res: BucketItem = {
              Name: name,
              Type: "folder",
              Key: folder,
            };
            return res;
          }) || []),
          ...(items?.map((item) => {
            const res: BucketItem = {
              Name: item.Key?.split("/").pop() || "",
              Type: "file",
              Key: item,
            };
            return res;
          }) || []),
        ];
        setItems(combinedItems);
      });
    }
  }, [bucketName, getBucketItems, buckets, folderPath]);

  return (
    <GenericTable
      data={items}
      columns={[
        {
          header: "Nombre",
          accessor: (item) => {
            if (item.Type === "folder") {
              return (
                <Link
                  to={`/ui/minio/${bucketName}/${
                    (item.Key as CommonPrefix).Prefix
                  }`}
                  replace
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Folder size="20px" /> {item.Name}
                </Link>
              );
            }
            return item.Name;
          },
        },
      ]}
      idKey="Name"
      // Añade acciones si es necesario
    />
  );
}

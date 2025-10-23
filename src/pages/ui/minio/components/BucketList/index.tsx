import DeleteDialog from "@/components/DeleteDialog";
import GenericTable from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { alert } from "@/lib/alert";
import OscarColors from "@/styles";
import { Bucket } from "@aws-sdk/client-s3";
import { Copy, ExternalLinkIcon, LoaderPinwheel, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface BucketList extends Bucket {
  from_service: string;
  owner: string;
}

export default function BucketList() {
  const { buckets, bucketsOSCAR, bucketsAreLoading, deleteBucket } = useMinio();
  const [itemsToDelete, setItemsToDelete] = useState<Bucket[]>([]);
  const [bucketsList, setBucketsList] = useState<BucketList[]>([]);

  useEffect(() => {
    if (buckets) {
      const updatedBucketsList = buckets.map((bucket) => {
        const oscarBucket = bucketsOSCAR.find((b) => b.bucket_name === bucket.Name);
        return {
          ...bucket,
          from_service: oscarBucket?.metadata?.from_service ?? "",
          owner: oscarBucket?.owner === "" ? "oscar" : oscarBucket?.owner,
        } as BucketList;
      });
      setBucketsList(updatedBucketsList);
    }
  }, [buckets]);

  return (
    <>
      <DeleteDialog
        isOpen={itemsToDelete.length > 0}
        onClose={() => setItemsToDelete([])}
        onDelete={() => {
          itemsToDelete.forEach((bucket) => deleteBucket(bucket.Name!));
        }}
        itemNames={itemsToDelete.map((bucket) => bucket.Name!)}
      />
      {bucketsAreLoading ? 
      <div className="flex items-center justify-center h-screen">
        <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
      </div>
      : 
      <GenericTable<BucketList>
        data={bucketsList}
        columns={[
          {
            header: "Name",
            accessor: (row) => (
              <Link to={`/ui/minio/${row.Name}`}>{row.Name}</Link>
            ),
            sortBy: "Name"
          },
          {
            header: "Owner",
            accessor: (row) => (
              <div 
                className="grid grid-cols-[auto_1fr] no-underline hover:underline underline-offset-2 cursor-pointer"
                onClick={() => {navigator.clipboard.writeText(row.owner ? row.owner : "oscar");alert.success("Owner copied to clipboard");}}
              >
                <span className="truncate min-w-[40px] max-w-[70px]">
                  {row.owner}
                </span>
                <Copy size={12} className="self-center ml-[2px]" />
              </div>
            ),
            sortBy: "owner"
          },
          {
            header: "Service",
            accessor: (row) => (
              <>
                {row.from_service ?
                  <Link
                    to={`/ui/services/${row.from_service}/settings`}
                    className="grid grid-cols-[auto_1fr] no-underline hover:underline underline-offset-2 border-gray-400"
                  >
                    <span className="truncate min-w-[70px] max-w-[70px]">
                      {row.from_service}
                    </span>
                    <ExternalLinkIcon size={12} className="self-center ml-[2px]"/>
                  </Link>
                  :
                  <span></span>
                }
              </>
            ),
            sortBy: "from_service"
          },
        ]}
        actions={[
          {
            button: (bucket) => {
              return (
                <>
                  <Button
                    variant="link"
                    size="icon"
                    onClick={() => {
                      setItemsToDelete([...itemsToDelete, bucket]);
                    }}
                  >
                    <Trash color={OscarColors.Red} />
                  </Button>
                </>
              );
            },
          },
        ]}
        idKey="Name"
      />
      }
    </>
  );
}

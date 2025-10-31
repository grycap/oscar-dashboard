import DeleteDialog from "@/components/DeleteDialog";
import GenericTable from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
  visibility: "private" | "public" | "restricted";
}

const visibilityColors = {
  private: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300"
  },
  public: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300"
  },
  restricted: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300"
  }
};

export default function BucketList() {
  const { buckets, bucketsOSCAR, bucketsAreLoading, deleteBucket, bucketsFilter } = useMinio();
  const [itemsToDelete, setItemsToDelete] = useState<Bucket[]>([]);
  const [bucketsList, setBucketsList] = useState<BucketList[]>([]);
  const [filteredBucketsList, setFilteredBucketsList] = useState<BucketList[]>([]);
  const { authData } = useAuth();

  useEffect(() => {
    if (buckets) {
      const updatedBucketsList = buckets.map((bucket) => {
        const oscarBucket = bucketsOSCAR.find((b) => b.bucket_name === bucket.Name);
        return {
          ...bucket,
          from_service: oscarBucket?.metadata?.from_service ?? "",
          owner: oscarBucket?.owner === "" ? "oscar" : oscarBucket?.owner,
          visibility: oscarBucket?.visibility ?? "private",
        } as BucketList;
      });
      setBucketsList(updatedBucketsList);
    }
  }, [buckets]);

  useEffect(() => {
    if (!bucketsList) return;

    let filteredBuckets = bucketsList;
    if (bucketsFilter.myBuckets) {
      filteredBuckets = filteredBuckets.filter(
        (bucket) => bucket.owner === authData.egiSession?.sub
      );
    }
    if (bucketsFilter.query) {
      filteredBuckets = filteredBuckets.filter((bucket) => {
        const fieldToFilter =
          bucketsFilter.by === "name"
            ? (bucket.Name ?? "")
            : bucketsFilter.by === "owner"
            ? bucket.owner
            : bucket.from_service;
        const query = bucketsFilter.query.toLowerCase();
        return query === "" || fieldToFilter.toLowerCase().startsWith(query);
      });
    }

    setFilteredBucketsList(filteredBuckets);
  }, [bucketsFilter, bucketsList]);

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
        data={filteredBucketsList}
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
                {row.owner !== authData.egiSession?.sub ?
                <>
                  <span className="truncate min-w-[40px]">
                    {row.owner}
                  </span>
                  <Copy size={12} className="self-center ml-[2px]" />
                </>
                :
                <>
                  <span className="truncate min-w-[40px]">
                    {"You"}
                  </span>
                  <Copy size={12} className="self-center -ml-[14px]" />
                  </>
                }
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
                    <span className="truncate min-w-[70px]">
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
          {
            header: "Visibility",
            accessor: (row) => {
              const colors = visibilityColors[row.visibility] || visibilityColors.private;
              return (
                <span className={`font-bold px-2 py-1 rounded-full text-xs border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {row.visibility.toUpperCase()}
                </span>
              );
            },
            sortBy: "visibility"
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

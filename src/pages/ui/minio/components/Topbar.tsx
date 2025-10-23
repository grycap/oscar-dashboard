import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Database, ExternalLinkIcon, FolderRoot, Slash } from "lucide-react";
import OscarColors from "@/styles";
import AddBucketButton from "./AddBucketButton";
import AddFolderButton from "./AddFolderButton";
import useSelectedBucket from "../hooks/useSelectedBucket";
import AddFileButton from "./AddFileButton";
//import UpdateBucketButton from "./UpdateBucketButton";
import { Bucket,Bucket_visibility } from "../../services/models/service";
import GenericTopbar from "@/components/Topbar";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { alert } from "@/lib/alert";


function MinioTopbar() {
  const { name, path } = useSelectedBucket();
  const { updateBuckets, bucketsOSCAR } = useMinio();
  const pathSegments = path ? path.split("/").filter(Boolean) : [];
  const [serviceAssociate, setServiceAssociate] = useState<Boolean>(true)

  const emptyBucket: Bucket = {
    bucket_name: "",
    visibility: Bucket_visibility.private,
    allowed_users: [],
  };

  const [bucket, setBucket] = useState<Bucket>(emptyBucket);

  const isOnRoot = name === undefined;

  useEffect(() => {
    document.title = isOnRoot ? "OSCAR - Buckets" : `OSCAR - Buckets: ${name}`;
    if (!isOnRoot) {
      let foundBucket = bucketsOSCAR.find(b => b.bucket_name === name);
      if(foundBucket?.metadata?.from_service){
        setServiceAssociate(true)
      }else{
        setServiceAssociate(false)
      }
      if(!foundBucket){
        foundBucket={
          bucket_name: "",
          visibility: Bucket_visibility.private,
          allowed_users: [],
        }
      }
      console.log("Found Bucket: ", foundBucket);
      setBucket(foundBucket);
    }
  }, [isOnRoot, name]);

  const breadcrumbs = useMemo(() => {
    return pathSegments.map((segment, index) => {
      const currentPath = pathSegments.slice(0, index + 1).join("/"); 
      if(index === pathSegments.length-3){
        return (
          <React.Fragment key={currentPath}>
            <Slash size={12} className="pt-[2px] text-gray-400" aria-hidden="true" />
            <span className="text-gray-500 font-medium">{`...`}</span>
          </React.Fragment>
        );
      }
      if(index === pathSegments.length-1 || index === pathSegments.length-2){
        return (
          <React.Fragment key={currentPath}>
            <Slash size={12} className="pt-[2px] text-gray-400" aria-hidden="true" />
            <Link
              to={`/ui/minio/${name}/${currentPath}/`}
              className="no-underline hover:text-gray-900 hover:underline transition-colors duration-200 text-gray-700 font-medium"
            >
              {segment}
            </Link>
          </React.Fragment>
        );
      }
    });
  }, [pathSegments, name]);

  return (
    <>
    <GenericTopbar defaultHeader={{title: "Buckets", linkTo: "/ui/minio"}} refresher={updateBuckets} 
    customHeader={
      !isOnRoot ? (
        <Link
          style={{ color: OscarColors.DarkGrayText }}
          to="/ui/minio"
          aria-label="Navigate to Buckets"
          className="no-underline hover:text-gray-800 transition-colors duration-200 flex items-center gap-2"
          onClick={() => setBucket(emptyBucket)}
        >
          <Database size={40} className="text-gray-500" />
        </Link>
      ) : undefined
    }
    secondaryRow={ 
      !isOnRoot ? ( 
        <div className="flex flex-col w-full ">
          <nav className="grid grid-cols-[auto_1fr] my-[6px] mx-1 items-center text-sm gap-0 border rounded-lg border-gray-300 bg-gray-50 shadow-sm overflow-hidden" aria-label="Breadcrumb">
            <Link
              to={`/ui/minio/${name}`}
              className="font-bold no-underline hover:text-gray-900 hover:bg-gray-100 px-0 py-2 transition-all duration-200 border-r border-gray-300 bg-white"
              aria-label={`Navigate to bucket ${name}`}
            >
              <div className="flex flex-row items-center px-4 gap-2">
                <FolderRoot size={19} className="text-gray-600"></FolderRoot>
                <span className="text-gray-900 font-semibold">{name}</span>
              </div>
            </Link>
            <div className="flex flex-row items-center px-3 py-2 bg-gradient-to-r from-gray-60 to-gray-100">
              <div className="flex flex-row items-center text-gray-600 gap-1">
                {breadcrumbs.length > 0 && breadcrumbs ? breadcrumbs : <Slash size={12} className="pt-[2px] text-gray-400" aria-hidden="true" />}
              </div>
            </div>
          </nav>
        </div>
      ) 
      : 
      <div>
        
      </div>
    }

    >
      <div className="flex flex-row items-center w-full justify-end gap-2">
        {isOnRoot ? 
        <AddBucketButton bucket={emptyBucket} create={true} /> 
        :
        <div className="flex flex-row items-center w-full justify-between gap-4" >
          <div className="flex flex-col">
            <Link
              to={`/ui/minio/${name}`}
              className="font-bold text-black no-underline hover:text-gray-700 transition-colors duration-200 min-w-max"
              aria-label={`Navigate to bucket ${name}`}
            >
              <div className="flex flex-row items-center text-[16px]">
                {name}
              </div>
              <span className="text-gray-600 text-[14px] flex flex-row uppercase">
                {bucket.visibility ? bucket.visibility : Bucket_visibility.private}
              </span>
            </Link>
            <div className="grid grid-cols-[auto_auto] items-center font-bold text-gray-500 text-[13px] text-nowrap -mt-1 gap-2">
              {/* Owner Name */}
              <div 
                className="grid grid-cols-[auto_1fr] no-underline hover:underline underline-offset-2 cursor-pointer"
                onClick={() => {
                          navigator.clipboard.writeText(bucket.owner ? bucket.owner : "oscar");
                          alert.success("Owner copied to clipboard");
                        }}
              >
                <span className="truncate min-w-[90px] max-w-[100px]">
                  {`Owner: ${bucket.owner ? bucket.owner : "oscar"}`}
                </span>
                <Copy size={12} className="self-center" />
              </div>
              {/* Service Name and it is Link */}
              {bucket.metadata?.from_service &&
                <Link 
                  to={`/ui/services/${bucket.metadata?.from_service}/settings`}
                  className="grid grid-cols-[auto_1fr] no-underline hover:underline underline-offset-2 border-l border-gray-400 pl-2"
                >
                  <span className="truncate min-w-[100px] max-w-[400px]">
                    {`Service: ${bucket.metadata?.from_service}`}
                  </span>
                  <ExternalLinkIcon size={12} className="self-center ml-[1px]"/>
                </Link>
              }
            </div>
          </div> 
          <div className="flex flex-row gap-2">
            { !serviceAssociate && bucket?.visibility ? 
            <AddBucketButton bucket={{...bucket, bucket_name: name}} create={false} />
            :
            <></> 
            } 
            <AddFolderButton /> <AddFileButton />
          </div>
        </div>
        }
      </div>
    </GenericTopbar>
    </>
  );
}

export default MinioTopbar;

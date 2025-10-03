import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Database, FolderRoot, Slash } from "lucide-react";
import OscarColors, { OscarStyles } from "@/styles";
import UserInfo from "@/components/UserInfo";
import AddBucketButton from "./AddBucketButton";
import AddFolderButton from "./AddFolderButton";
import useSelectedBucket from "../hooks/useSelectedBucket";
import AddFileButton from "./AddFileButton";
//import UpdateBucketButton from "./UpdateBucketButton";
import getBucketsApi from "@/api/buckets/getBucketsApi";
import { Bucket,Bucket_visibility } from "../../services/models/service";


function MinioTopbar() {
  const { name, path } = useSelectedBucket();
  const pathSegments = path ? path.split("/").filter(Boolean) : [];
  const [serviceAssociate, setServiceAssociate] = useState<Boolean>(true)
  const [bucket, setBucket] = useState<Bucket>({
      bucket_path: "",
      visibility: Bucket_visibility.private,
      allowed_users: [],
    });

  const isOnRoot = name === undefined;

  useEffect(() => {
    document.title = isOnRoot ? "OSCAR - Buckets" : `OSCAR - Buckets: ${name}`;
      if (!isOnRoot) {
        const selectBucket = async () => {
          const allBucket = await getBucketsApi();
          let foundBucket = allBucket.find(b => b.bucket_path === name);
          console.log(allBucket)
          console.log(foundBucket?.metadata?.service)
          if(foundBucket?.metadata?.service == undefined || foundBucket?.metadata?.service == "true"){
            setServiceAssociate(true)
          }else{
            setServiceAssociate(false)
          }
          if(!foundBucket){
            foundBucket={
              bucket_path: "",
              visibility: Bucket_visibility.private,
              allowed_users: [],
            }
          }
          setBucket(foundBucket);
        };
        selectBucket()
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
    <header className="grid grid-cols-[auto_1fr_auto] gap-4 min-w-[800px]"
      style={{
        minHeight: "64px",
        borderBottom: OscarStyles.border,
      }}
    >
      <div className="grid grid-cols-1 items-center pl-4 text-gray-600 text-lg no-underline">
        <Link
          style={{ color: OscarColors.DarkGrayText }}
          to="/ui/minio"
          aria-label="Navigate to Buckets"
          className="no-underline hover:text-gray-800 transition-colors duration-200 flex items-center gap-2"
        >
          {!isOnRoot ? <Database size={40} className="text-gray-500" /> : "Buckets"}
        </Link>
      </div>
      <div className="grid grid-cols-[1fr_auto]">
        <div className="grid grid-flow-col grid-rows-1">
          {!isOnRoot &&
          <>
          <nav className="flex flex-row items-center" aria-label="Breadcrumb">
            
              <Link
                to={`/ui/minio/${name}`}
                className="font-bold text-black no-underline hover:text-gray-700 transition-colors duration-200"
                aria-label={`Navigate to bucket ${name}`}
              >
                <div className="flex flex-row items-center text-lg">
                  {name}
                </div>
              </Link>
            
          </nav>
          {/*<div className="flex flex-row items-center text-xs text-gray-600 truncate mt-1">
            Access: PRIVATE | Size: 200Mb | Owner: oscar
          </div>*/}
          </>
          }
        </div>

        <div className="flex flex-row items-center gap-2 pl-2">
          {isOnRoot ? 
          <AddBucketButton bucket={bucket} create={true} /> 
          :
          <div className="flex flex-row items-center gap-2"> 
            { !serviceAssociate ? 
            <AddBucketButton bucket={bucket} create={false} />
            :
            <></> 
            } 
            <AddFolderButton /> <AddFileButton />
          </div>
          }
        </div>
      </div>
      <UserInfo />
    </header>
    
    {!isOnRoot && 
    <div className="flex flex-col">
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
    }
    </>
  );
}

export default MinioTopbar;

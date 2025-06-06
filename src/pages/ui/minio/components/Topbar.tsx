import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
            <ChevronRight size={24} className="pt-[2px]" aria-hidden="true" />
            {`...`}
          </React.Fragment>
        );
      }
      if(index === pathSegments.length-1 || index === pathSegments.length-2){
        return (
          <React.Fragment key={currentPath}>
            <ChevronRight size={24} className="pt-[2px]" aria-hidden="true" />
            <Link
              to={`/ui/minio/${name}/${currentPath}`}
              className="no-underline hover:underline"
            >
              {segment}
            </Link>
          </React.Fragment>
        );
      }
    });
  }, [pathSegments, name]);

  return (
    <header
      style={{
        minHeight: "64px",
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
            className="text-dark-gray-text text-lg no-underline"
            style={{ color: OscarColors.DarkGrayText }}
          >
            {isOnRoot ? (
              <span>Buckets</span>
            ) : (
              <div className="flex flex-row items-center gap-1">
                <Link
                  to="/ui/minio"
                  aria-label="Navigate to Buckets"
                  className="no-underline hover:underline"
                >
                  Buckets
                </Link>
                <ChevronRight
                  size={24}
                  className="mt-[2px] stroke-black"
                  aria-hidden="true"
                />
                <Link
                  to={`/ui/minio/${name}`}
                  className="font-bold text-black no-underline hover:underline"
                  aria-label={`Navigate to bucket ${name}`}
                >
                  {name}
                </Link>
              </div>
            )}
          </h1>
          <nav
            className="flex flex-row items-center gap-1"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.length > 0 && breadcrumbs}
          </nav>
        </div>
        {isOnRoot ? 
        <AddBucketButton bucket={bucket} create={true} /> 
        :
        <div className="flex flex-row items-center gap-1"> 
          { !serviceAssociate ? 
          <AddBucketButton bucket={bucket} create={false} />
          :
          <></> 
          } 
          <AddFolderButton /> <AddFileButton />
        </div>
        }
      </div>
      <UserInfo />
    </header>
  );
}

export default MinioTopbar;

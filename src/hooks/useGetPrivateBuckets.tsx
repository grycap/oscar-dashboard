import getBucketsApi from "@/api/buckets/getBucketsApi";
import { Bucket, Bucket_visibility } from "@/pages/ui/services/models/service";
import { useEffect, useState } from "react";

function useGetPrivateBuckets() {
  const [ buckets, setBuckets ] = useState<Bucket[]>([]);

  useEffect(() => {
    const fetchBuckets = async () => {
      const bucketsData = await getBucketsApi();
      const filteredBuckets = bucketsData.filter(bucket => (
        (!bucket.visibility || bucket.visibility === Bucket_visibility.private)
      ));
      setBuckets(filteredBuckets);
    };
    fetchBuckets();
  }, []);

  return buckets;
}

export default useGetPrivateBuckets;
import getBucketsApi from "@/api/buckets/getBucketsApi";
import { Bucket, Bucket_visibility } from "@/pages/ui/services/models/service";
import { useEffect, useState } from "react";

function useGetPrivateBuckets(enabled: boolean = true) {
  const [ buckets, setBuckets ] = useState<Bucket[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchBuckets = async () => {
      const bucketsData = await getBucketsApi();
      const filteredBuckets = bucketsData.filter(bucket => (
        (!bucket.visibility || bucket.visibility === Bucket_visibility.private)
      ));
      setBuckets(filteredBuckets);
    };
    fetchBuckets();
  }, [enabled]);

  return buckets;
}

export default useGetPrivateBuckets;
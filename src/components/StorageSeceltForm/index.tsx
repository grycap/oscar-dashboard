import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useGetPrivateBuckets from "@/hooks/useGetPrivateBuckets";
import useGetVolumes from "@/hooks/useGetVolumes";
import CustomSwitch from "../CustomSwitch";

function StorageSelectForm({ formData, setFormData, errors, manageBucket = true, manageVolume = true }: { formData: any; setFormData: Function; errors: any; manageBucket?: boolean; manageVolume?: boolean }) {
  const [newBucket, setNewBucket] = useState(true);
  const [bucketLoading, setBucketLoading] = useState(true);
  const buckets = useGetPrivateBuckets(!newBucket);
  const [newVolume, setNewVolume] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const volumes = useGetVolumes(!newVolume);
  const [mainStorage, setMainStorage] = useState<"volume" | "bucket">(
    !manageBucket && manageVolume ? "volume" : "bucket"
  );
  const [addVolume, setAddVolume] = useState(mainStorage === "volume" || formData.addVolume);
  const [addBucket, setAddBucket] = useState(mainStorage === "bucket" || formData.addBucket);

  const isMainStorage = (storageType: "volume" | "bucket") => {
    return mainStorage === storageType;
  };

  const setBucketValue = (value: string) => {
    const bucketValue = value ?? "";
    setFormData({ ...formData, bucket: bucketValue });
    /*if (bucketValue.trim()) {
      setErrors((prev: any) => ({ ...prev, bucket: false }));
    } else {
      setErrors((prev: any) => ({ ...prev, bucket: true }));
    }*/
  };

  const setVolumeValue = (value: string) => {
    const volumeValue = value ?? "";
    setFormData({ ...formData, volume: volumeValue });
    /*if (volumeValue.trim()) {
      setErrors((prev: any) => ({ ...prev, volume: false }));
    } else {
      setErrors((prev: any) => ({ ...prev, volume: true }));
    }*/
  };

  useEffect(() => {
    if (manageBucket && !manageVolume) {
      setMainStorage("bucket");
      setAddBucket(true);
    } else if (!manageBucket && manageVolume) {
      setMainStorage("volume");
      setAddVolume(true);
    }
  }, [manageBucket, manageVolume]);

  useEffect(() => {
    if (newBucket || buckets.length > 0) {
      setBucketLoading(false);
      return;
    }

    setBucketLoading(true);
    const timeout = window.setTimeout(() => setBucketLoading(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [newBucket, buckets.length]);

  useEffect(() => {
    if (newVolume || volumes.length > 0) {
      setVolumeLoading(false);
      return;
    }

    setVolumeLoading(true);
    const timeout = window.setTimeout(() => setVolumeLoading(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [newVolume, volumes.length]);

  useEffect(() => {
    if (newVolume && formData.volumeSize === "") {
      setFormData({ ...formData, volumeSize: "1" });
    }
    if (!newVolume) {
      setFormData({ ...formData, volumeSize: "" });
    }
  }, [newVolume]);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      addBucket,
      addVolume,
      newBucket,
      newVolume,
    }));
  }, [addBucket, addVolume, newBucket, newVolume]);

  return (
    <div className="flex flex-col gap-2 pt-2">
      {manageBucket && (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center mb-1 gap-2">
          <Label>Bucket</Label>
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("bucket")} onChange={() => { setMainStorage("bucket"); setAddBucket(true); setFormData({ ...formData, mainStorage: "bucket" }); }} />
          <CustomSwitch variant="checkbox" title="Add Bucket" checked={addBucket} onChange={() => {
            const nextAddBucket = !addBucket || mainStorage === "bucket";
            setAddBucket(nextAddBucket);
            !nextAddBucket ? setFormData({ ...formData, bucket: "" }) : null;
           /* if (!nextAddBucket) {
              setErrors((prev: any) => ({ ...prev, bucket: false }));
            } else if (!formData.bucket?.trim()) {
              setErrors((prev: any) => ({ ...prev, bucket: true }));
            }*/
          }} />
        </div>
        <hr className="mb-2"/>
        {addBucket && (
        <div>
          <CustomSwitch title="New Bucket" checked={newBucket} onChange={() => { setNewBucket(!newBucket); setFormData({ ...formData, bucket: "" }); }} />
          {newBucket? 
          <Input
            type="input"
            onFocus={(e) => (e.target.type = "text")}
            style={{ width: "100%",
              fontWeight: "normal",
              }}
            onChange={(e) => {
              setBucketValue(e.target?.value);
            }}
            placeholder="Enter new bucket name"
            error={errors.bucket ? "Bucket is required" : undefined}
          />
          :
            <Select
              value={formData.bucket}
              onValueChange={(value) => {
                setBucketValue(value);
              }}
            >
              <SelectTrigger className={errors.bucket ? "border-red-500 focus:border-red-500" : ""}>
                <SelectValue
                  placeholder="Select a bucket"
                />
              </SelectTrigger>
              <SelectContent>
                { buckets.length === 0 ? (
                  <SelectItem value="" disabled>
                    {bucketLoading ? "Loading..." : "No buckets available"}
                  </SelectItem>
                )
                :
                buckets.map((bucket) => (
                  <SelectItem key={bucket.bucket_name} value={bucket.bucket_name}>
                    {bucket.bucket_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        </div>
        )}
      </div>
      )}
      {manageVolume && (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center mb-1 gap-2">
          <Label>Volume</Label>
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("volume")} onChange={() => { setMainStorage("volume"); setAddVolume(true); setFormData({ ...formData, mainStorage: "volume" }); }} />
          <CustomSwitch variant="checkbox" title="Add Volume" checked={addVolume} onChange={() => {
            const nextAddVolume = !addVolume || mainStorage === "volume";
            setAddVolume(nextAddVolume);
            !nextAddVolume ? setFormData({ ...formData, volume: "" }) : null;
            /*if (!nextAddVolume ) {
              setErrors((prev: any) => ({ ...prev, volume: false }));
            } else if (!formData.volume?.trim()) {
              setErrors((prev: any) => ({ ...prev, volume: true }));
            }*/
          }} />
        </div>
        <hr className="mb-2"/>
        {addVolume && (
        <div className={`grid grid-cols-1 ${newVolume ? "sm:grid-cols-2" : ""} gap-2`}>
          <div className="flex flex-col gap-2">
          <CustomSwitch title="New Volume" checked={newVolume} onChange={() => { 
            const nextNewVolume = !newVolume;
            setNewVolume(nextNewVolume); 
            if (nextNewVolume && formData.volumeSize === "") {
              setFormData({ ...formData, volumeSize: "1" });
            } else if (!nextNewVolume) {
              setFormData({ ...formData, volumeSize: "" });
            }
            }} 
          />
          {newVolume?
          <Input
            type="input"
            onFocus={(e) => (e.target.type = "text")}
            style={{ width: "100%",
              fontWeight: "normal",
              }}
            onChange={(e) => {
              setVolumeValue(e.target?.value);
            }}
            placeholder="Enter new volume name"
            error={errors.volume ? "Volume is required" : undefined}
          />
          :
            <Select
              value={formData.volume}
              onValueChange={(value) => {
                setVolumeValue(value);
              }}
            >
              <SelectTrigger className={errors.volume ? "border-red-500 focus:border-red-500" : ""}>
                <SelectValue
                  placeholder="Select a volume"
                />
              </SelectTrigger>
              <SelectContent>
                { volumes.length === 0 ? (
                  <SelectItem value="" disabled>
                    {volumeLoading ? "Loading..." : "No volumes available"}
                  </SelectItem>
                )
                :
                volumes.map((volume) => (
                  <SelectItem key={volume.name} value={volume.name}>
                    {volume.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          </div>
          {newVolume && (
          <div className="flex flex-col gap-2">
            <Label className="h-[20px] flex items-center">Volume size (Gi)</Label>
            <Input
              type="number"
              style={{ width: "100%",
                fontWeight: "normal",
                }}
              onChange={(e) => {
                setFormData({ ...formData, volumeSize: e.target?.value });
               /* if (e.target.value === "" || parseInt(e.target.value) < 1) {
                  setErrors({ ...errors, volumeSize: true});
                } else {
                  setFormData({ ...formData, volumeSize: e.target?.value });
                  if (errors.volumeSize) setErrors({ ...errors, volumeSize: false });
                }*/
              }}
              defaultValue={1}
              min={1}
              placeholder="Enter new volume size (e.g. 1)"
              error={errors.volumeSize ? "Volume size must be a positive number" : undefined}
            />
          </div>
          )}
        </div>
        )}
      </div>
      )}
    </div>
  );
}

export default StorageSelectForm;
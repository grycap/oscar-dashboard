import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useGetPrivateBuckets from "@/hooks/useGetPrivateBuckets";
import useGetVolumes from "@/hooks/useGetVolumes";
import CustomSwitch from "../CustomSwitch";

function StorageSelectForm({ formData, setFormData, errors, setErrors }: any) {
  const [newBucket, setNewBucket] = useState(true);
  const [bucketLoading, setBucketLoading] = useState(true);
  const buckets = useGetPrivateBuckets(!newBucket);
  const [newVolume, setNewVolume] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const volumes = useGetVolumes(!newVolume);
  const [mainStorage, setMainStorage] = useState<"volume" | "bucket">("bucket");
  const [addVolume, setAddVolume] = useState(false);
  const [addBucket, setAddBucket] = useState(true);

  const isMainStorage = (storageType: "volume" | "bucket") => {
    return mainStorage === storageType;
  };

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

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center mb-1 gap-2">
          <Label>Bucket</Label>
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("bucket")} onChange={() => { setMainStorage("bucket"); setAddBucket(true); setFormData({ ...formData, mainStorage: "bucket" }); }} />
          <CustomSwitch variant="checkbox" title="Add Bucket" checked={addBucket} onChange={() => { setAddBucket(!addBucket || mainStorage === "bucket"); !addBucket ? setFormData({ ...formData, bucket: "" }) : null; }} />
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
            className={errors.bucket ? "border-red-500 focus:border-red-500" : ""}
            onChange={(e) => {
                setFormData({ ...formData, bucket: e.target?.value });
                if (errors.bucket) setErrors({ ...errors, bucket: false });
            }}
            placeholder="Enter new bucket name"
          />
          :
            <Select
              value={formData.bucket}
              onValueChange={(value) => {
                setFormData({ ...formData, bucket: value });
                if (errors.bucket) setErrors({ ...errors, bucket: false });
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
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center mb-1 gap-2">
          <Label>Volume</Label>
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("volume")} onChange={() => { setMainStorage("volume"); setAddVolume(true); setFormData({ ...formData, mainStorage: "volume" }); }} />
          <CustomSwitch variant="checkbox" title="Add Volume" checked={addVolume} onChange={() => { setAddVolume(!addVolume || mainStorage === "volume"); !addVolume ? setFormData({ ...formData, volume: "" }) : null; }} />
        </div>
        <hr className="mb-2"/>
        {addVolume && (
        <div className={`grid grid-cols-1 ${newVolume ? "sm:grid-cols-2" : ""} gap-2`}>
          <div className="flex flex-col gap-2">
          <CustomSwitch title="New Volume" checked={newVolume} onChange={() => { setNewVolume(!newVolume); setFormData({ ...formData, volume: "" }); }} />
          {newVolume?
          <Input
            type="input"
            onFocus={(e) => (e.target.type = "text")}
            style={{ width: "100%",
              fontWeight: "normal",
              }}
            className={errors.volume ? "border-red-500 focus:border-red-500" : ""}
            onChange={(e) => {
                setFormData({ ...formData, volume: e.target?.value });
                if (errors.volume) setErrors({ ...errors, volume: false });
            }}
            placeholder="Enter new volume name"
          />
          :
            <Select
              value={formData.volume}
              onValueChange={(value) => {
                setFormData({ ...formData, volume: value });
                if (errors.volume) setErrors({ ...errors, volume: false });
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
              className={errors.volumeSize ? "border-red-500 focus:border-red-500" : ""}
              onChange={(e) => {
                if (e.target.value === "" || parseInt(e.target.value) < 1) {
                  setErrors({ ...errors, volumeSize: true});
                } else {
                  setFormData({ ...formData, volumeSize: e.target?.value });
                  if (errors.volumeSize) setErrors({ ...errors, volumeSize: false });
                }
              }}
              min={1}
              placeholder="Enter new volume size (e.g. 1)"
              error={errors.volumeSize ? "Volume size must be a positive number" : undefined}
            />
          </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

export default StorageSelectForm;
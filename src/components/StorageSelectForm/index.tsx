import { useEffect, useImperativeHandle, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useGetPrivateBuckets from "@/hooks/useGetPrivateBuckets";
import useGetVolumes from "@/hooks/useGetVolumes";
import CustomSwitch from "../CustomSwitch";

interface StorageConfig {
  bucket: string;
  volume: string;
  volumeSize: string;
  mainStorage: "volume" | "bucket";
}

interface StorageSelectFormProps {
  manageBucket?: boolean;
  manageVolume?: boolean;
  ref: React.Ref<StorageSelectFormRef>
}

export interface StorageSelectFormRef {
  validate: () => boolean;
  getStorageConfig: () => StorageConfig;
}

function StorageSelectForm({ manageBucket = true, manageVolume = true, ref }: StorageSelectFormProps) {
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    bucket: "",
    volume: "",
    volumeSize: "1",
    mainStorage: !manageBucket && manageVolume ? "volume" : "bucket",
  });

  const [errors, setErrors] = useState<{ bucket?: boolean; volume?: boolean; volumeSize?: boolean }>({});

  const [newBucket, setNewBucket] = useState(true);
  const [bucketLoading, setBucketLoading] = useState(true);
  const buckets = useGetPrivateBuckets(!newBucket);
  const [newVolume, setNewVolume] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const volumes = useGetVolumes(!newVolume);
  const [addVolume, setAddVolume] = useState(storageConfig.mainStorage === "volume");
  const [addBucket, setAddBucket] = useState(storageConfig.mainStorage === "bucket");

  const isMainStorage = (storageType: "volume" | "bucket") => {
    return storageConfig.mainStorage === storageType;
  };

  const setBucketValue = (value: string) => {
    const bucketValue = value ?? "";
    setStorageConfig({ ...storageConfig, bucket: bucketValue });
  };

  const setVolumeValue = (value: string) => {
    const volumeValue = value ?? "";
    setStorageConfig({ ...storageConfig, volume: volumeValue });
  };

  const setMainStorage = (storageType: "volume" | "bucket") => {
    setStorageConfig({ ...storageConfig, mainStorage: storageType });
  }

  useImperativeHandle(ref, () => {
    return {
      validate() {
        const nextErrors = {
          bucket: addBucket && !storageConfig.bucket.trim(),
          volume: addVolume && !storageConfig.volume.trim(),
          volumeSize: newVolume && (!storageConfig.volumeSize || parseInt(storageConfig.volumeSize) < 1),
        };
        setErrors((prev: any) => ({ ...prev, ...nextErrors }));
        return !Object.values(nextErrors).some(Boolean);
      },
      getStorageConfig() {
        return storageConfig;
      },
    };
  }, [storageConfig, addBucket, addVolume, newVolume]);

  useEffect(() => {
    if (manageBucket && !manageVolume) {
      setStorageConfig({ ...storageConfig, mainStorage: "bucket" });
      setAddBucket(true);
    } else if (!manageBucket && manageVolume) {
      setStorageConfig({ ...storageConfig, mainStorage: "volume" });
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
    if (newVolume && storageConfig.volumeSize === "") {
      setStorageConfig({ ...storageConfig, volumeSize: "1" });
    }
    if (!newVolume) {
      setStorageConfig({ ...storageConfig, volumeSize: "" });
    }
  }, [newVolume]);

  return (
    <div className="flex flex-col gap-2 pt-2">
      {manageBucket && (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center mb-1 gap-2">
          <Label>Bucket</Label>
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("bucket")} onChange={() => { setMainStorage("bucket"); setAddBucket(true); setStorageConfig({ ...storageConfig, mainStorage: "bucket" }); }} />
          <CustomSwitch variant="checkbox" title="Add Bucket" checked={addBucket} onChange={() => {
            const nextAddBucket = !addBucket || storageConfig.mainStorage === "bucket";
            setAddBucket(nextAddBucket);
            !nextAddBucket ? setStorageConfig({ ...storageConfig, bucket: "" }) : null;
          }} />
        </div>
        <hr className="mb-2"/>
        {addBucket && (
        <div>
          <CustomSwitch title="New Bucket" checked={newBucket} onChange={() => { setNewBucket(!newBucket); setStorageConfig({ ...storageConfig, bucket: "" }); }} />
          {newBucket? 
          <Input
            type="input"
            onFocus={(e) => (e.target.type = "text")}
            style={{ width: "100%",
              fontWeight: "normal",
              }}
            onChange={(e) => {
              setBucketValue(e.target?.value);
              setErrors((prev: any) => ({ ...prev, bucket: !e.target.value }));
            }}
            placeholder="Enter new bucket name"
            error={errors.bucket ? "Bucket is required" : undefined}
          />
          :
            <Select
              value={storageConfig.bucket}
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
          <CustomSwitch variant="checkbox" title="Main Storage" checked={isMainStorage("volume")} onChange={() => { setMainStorage("volume"); setAddVolume(true); setStorageConfig({ ...storageConfig, mainStorage: "volume" }); }} />
          <CustomSwitch variant="checkbox" title="Add Volume" checked={addVolume} onChange={() => {
            const nextAddVolume = !addVolume || storageConfig.mainStorage === "volume";
            setAddVolume(nextAddVolume);
            !nextAddVolume ? setStorageConfig({ ...storageConfig, volume: "" }) : null;
          }} />
        </div>
        <hr className="mb-2"/>
        {addVolume && (
        <div className={`grid grid-cols-1 ${newVolume ? "sm:grid-cols-2" : ""} gap-2`}>
          <div className="flex flex-col gap-2">
          <CustomSwitch title="New Volume" checked={newVolume} onChange={() => { 
            const nextNewVolume = !newVolume;
            setNewVolume(nextNewVolume); 
            if (nextNewVolume && storageConfig.volumeSize === "") {
              setStorageConfig({ ...storageConfig, volumeSize: "1" });
            } else if (!nextNewVolume) {
              setStorageConfig({ ...storageConfig, volumeSize: "" });
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
              setErrors((prev: any) => ({ ...prev, volume: !e.target.value }));
            }}
            placeholder="Enter new volume name"
            error={errors.volume ? "Volume is required" : undefined}
          />
          :
            <Select
              value={storageConfig.volume}
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
              value={storageConfig.volumeSize}
              style={{ width: "100%",
                fontWeight: "normal",
                }}
              onChange={(e) => {
                setStorageConfig({ ...storageConfig, volumeSize: e.target?.value });
                setErrors((prev: any) => ({ ...prev, volumeSize: !e.target.value || parseInt(e.target.value) < 1 }));
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
      )}
    </div>
  );
}

export default StorageSelectForm;
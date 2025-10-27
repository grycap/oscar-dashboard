import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Plus, ShieldEllipsis } from "lucide-react";
import { Bucket, Bucket_visibility } from "@/pages/ui/services/models/service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllowedUsersPopover } from "@/pages/ui/services/components/ServiceForm/components/GeneralTab/components/AllowedUsersPopover";
import { useMediaQuery } from "react-responsive";

interface Props {
  bucket:Bucket;
  create: Boolean;
}

export default function AddBucketButton({bucket, create}: Props) {
  const [ formBucket, setFormBucket ] = useState<Bucket>(bucket);
  const createButtom=create
  const [isOpen, setIsOpen] = useState(false);
  const { createBucket, updateBucketsVisibilityControl } = useMinio();
  const isSmallScreen = useMediaQuery({ maxWidth: 799 });


  const handleCreateBucket = async () => {
    await createBucket(formBucket);
    setIsOpen(false);
  };

  const handleUpdateBucket = async () => {
    await updateBucketsVisibilityControl(formBucket);
    setIsOpen(false);
  };
  const setAllowedUsers = (users: string[]) => {
    setFormBucket((prev) => ({
      ...prev,
      allowed_users: users
    }));
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Enter") {
        handleCreateBucket();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateBucket]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="mainGreen" style={{gap: 8}}>
          {createButtom? 
          <><Plus size={20} />
          New</>
          :
          <><ShieldEllipsis size={20} />
          {!isSmallScreen && "Change visibility"}</>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none"> {createButtom? "New" :"Change visibility"}</h4>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bucketName">Bucket Name:</Label>
            <Input
              id="bucketName"
              disabled={!createButtom}
              className="disabled:bg-gray"
              value={formBucket?.bucket_name}
              onChange={(e) => {
                setFormBucket((bucket: Bucket) => {
                    return {
                      ...bucket,
                      bucket_name: e.target.value,
                    };
                  });
                }}
              placeholder="Enter bucket name"
            />
          </div>
          <Label htmlFor="bucketName">Visibility:</Label>
          <Select
                value={formBucket?.visibility}
                onValueChange={(value:Bucket_visibility) => {
                  setFormBucket((bucket: Bucket) => {
                    return {
                      ...bucket,
                      visibility: value,
                    };
                  });
                }}
              >
                <SelectTrigger id="bucket-select-trigger">
                  <SelectValue placeholder="Select a Bucket Visibility" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(Bucket_visibility) as Array<keyof typeof Bucket_visibility>)?.map((kind) => {
                    return (
                      <SelectItem key={kind} value={kind}>
                        {kind}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
          {formBucket.visibility=="restricted" ? <div className="flex flex-row gap-2 items-center">
                <strong>Allowed users:</strong>
                  <AllowedUsersPopover
                  allowed_users={formBucket.allowed_users?formBucket.allowed_users:[]}
                  setAllowedUsersInExternalVar={setAllowedUsers} />
          </div> :
          <></>
          }
   
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {createButtom? 
            <Button onClick={handleCreateBucket} >
              Create
            </Button> :
            <Button onClick={handleUpdateBucket} >
              Update
            </Button>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { alert } from "@/lib/alert";
import { generateReadableName, genRandomString } from "@/lib/utils";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";


function JunoFormPopover() {
  const { buckets } = useMinio();
  const [isOpen, setIsOpen] = useState(false);
  const {systemConfig, authData } = useAuth();
  const { refreshServices } = useServicesContext();
  const [newBucket, setNewBucket] = useState(false);

  const oidcGroups = systemConfig?.config.oidc_groups ?? [];

  const [formData, setFormData] = useState({
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    bucket: "",
    vo: "",
    token: "",
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev, 
      cpuCores: "1.0",
      memoryRam: "2",
      memoryUnit: "Gi",
      bucket: "",
      token: genRandomString(128),
    }));
  }, [isOpen]);

  const handleDeploy = async () => {
    if (
      !formData.cpuCores ||
      !formData.memoryRam ||
      !formData.bucket ||
      !formData.vo ||
      !formData.token
    ) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      const fdlUrl =
        "https://raw.githubusercontent.com/grycap/oscar-juno/refs/heads/main/juno.yaml";
      const fdlResponse = await fetch(fdlUrl);
      const fdlText = await fdlResponse.text();

      const scriptUrl =
        "https://raw.githubusercontent.com/grycap/oscar-juno/refs/heads/main/script.sh";
      const scriptResponse = await fetch(scriptUrl);
      const scriptText = await scriptResponse.text();

      const services = yamlToServices(fdlText, scriptText);
      if (!services?.length) throw Error("No services found");
      
      const service = services[0];

      const serviceName = `juno-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
      
      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        mount: {
          ...service.mount,
          path: formData.bucket ?? "/notebook",
          storage_provider: service.mount?.storage_provider ?? "minio.default",
        },
        environment: {
          variables: {
            ...service.environment.variables,
            JHUB_BASE_URL: `/system/services/${serviceName}/exposed`,
            JUPYTER_DIRECTORY: "/mnt/"+ formData.bucket,
            GRANT_SUDO: "yes",
            OSCAR_ENDPOINT: authData.endpoint,
            JUPYTER_TOKEN: formData.token,
          },
          secrets:{
            ...service.environment.secrets,
          },
        },
        labels: {
          ...service.labels,
          jupyter_notebook: "true",
        },
      };
      console.log(modifiedService)

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Jupyter Notebook instance deployed");
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error("Error deploying Jupyter Notebook instance");
    }
  };

  useEffect(() => {
    if (oidcGroups.length) {
      setFormData({ ...formData, vo: oidcGroups[0] });
    }
  }, [oidcGroups.length]);  

return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          tooltipLabel="New Jupyter Notebook Instance"
          onClick={() => {setIsOpen(false)}}
        >
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90%] overflow-y-auto gap-4">
        <DialogHeader>
        <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
            {`Jupyter Notebook Instance Configuration`}
            </span>
        </DialogTitle>
        </DialogHeader>
          <hr></hr>
          <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <div>
                <Label htmlFor="cpu-cores">CPU Cores</Label>
                <Input
                  id="cpu-cores"
                  type="number"
                  step={0.1}
                  placeholder="Enter CPU Cores"
                  value={formData.cpuCores}
                  onChange={(e) =>
                    setFormData({ ...formData, cpuCores: e.target.value })
                  }
                ></Input>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label htmlFor="memory-ram">Memory RAM</Label>
                    <Input
                      id="memory-ram"
                      type="number"
                      step={formData.memoryUnit === "Gi" ? 1 : 256}
                      placeholder="Enter memory RAM"
                      value={formData.memoryRam}
                      onChange={(e) =>
                        setFormData({ ...formData, memoryRam: e.target.value })
                      }
                    />
                  </div>
                  <Select
                    value={formData.memoryUnit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, memoryUnit: value })
                    }
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue id="memory-unit" placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gi">Gi</SelectItem>
                      <SelectItem value="Mi">Mi</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div>
                <Label htmlFor="vo">VO</Label>
                <Select
                value={formData.vo}
                onValueChange={(value) =>
                    setFormData({ ...formData, vo: value })
                }
                >
                <SelectTrigger id="vo">
                    <SelectValue placeholder="Select a VO" />
                </SelectTrigger>
                <SelectContent>
                    {oidcGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                        {group}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div>
              <Label className="flex items-center">
                Token
                <Button variant={"link"} size={"icon"} 
                  onClick={() => setFormData({ ...formData, token: genRandomString(128)})}
                >
                  <RefreshCcwIcon size={16} 
                    onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
                  />
                </Button>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter credentials secret"
                value={formData.token}
                onChange={(e) =>
                  setFormData({ ...formData, token: e.target.value })
                }
              ></Input>
            </div>
            <div>
              <Label>Bucket</Label>
              <hr className="mb-2"/>
              <div>
                <Label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" onClick={() => { setNewBucket(!newBucket) }} />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">New Bucket</span>
                </Label>
                {newBucket? 
                <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%",
                    fontWeight: "normal",
                    }}
                  onChange={(e) => {
                      setFormData({ ...formData, bucket: e.target?.value })
                  }}
                  placeholder="Enter new bucket name"
                />
                :
                  <Select
                    value={formData.bucket}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bucket: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select a bucket"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.map((bucket) => (
                        <SelectItem key={bucket.Name} value={bucket.Name!}>
                          {bucket.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              </div>
            </div>
          </div>
        <DialogFooter>
          <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2" variant={"mainGreen"} request={handleDeploy}>
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default JunoFormPopover;
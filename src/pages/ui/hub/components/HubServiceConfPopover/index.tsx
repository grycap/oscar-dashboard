import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { generateReadableName, genRandomString, getAllowedVOs } from "@/lib/utils";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { RoCrateServiceDefinition } from "@/lib/roCrate";

interface HubServiceConfPopoverProps {
    roCrateServiceDef: RoCrateServiceDefinition;
    service: Service;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
		className?: ButtonProps["className"];
		variant?: ButtonProps["variant"];
		title?: string;
}

function HubServiceConfPopover({ roCrateServiceDef, service, isOpen = false, setIsOpen, className = "", variant = "default", title = "Deploy Service" }: HubServiceConfPopoverProps) {
  const {systemConfig, authData } = useAuth();
  const { refreshServices } = useServicesContext();

  const oidcGroups = getAllowedVOs(systemConfig, authData);
	const asyncService = roCrateServiceDef.type.toLowerCase() === "asynchronous";

  function nameService() {
    return `hub-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    bucket: "",
    vo: "",
    token: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    bucket: false,
    vo: false,
    token: false,
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
      name: nameService(),
      cpuCores: roCrateServiceDef.cpuRequirements,
      memoryRam: roCrateServiceDef.memoryRequirements,
      memoryUnit: roCrateServiceDef.memoryUnits,
      bucket: "",
      token: genRandomString(128),
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      bucket: false,
      vo: false,
      token: false,
    });
  }, [isOpen]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      bucket: !formData.bucket && asyncService,
      vo: !formData.vo,
      token: !formData.token,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      const scriptResponse = await fetch(roCrateServiceDef.scriptUrl);
      const scriptText = await scriptResponse.text();

      service.script = scriptText
      const serviceName = formData.name || nameService();

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores.toString(),
        input: asyncService ? 
					[{
						storage_provider: "minio.default",
						path: `${formData.bucket}/input`,
						suffix: [],
						prefix: []
					}] : [],
				output: asyncService ? 
					[{
						storage_provider: "minio.default",
						path: `${formData.bucket}/output`,
						suffix: [],
						prefix: []
					}] : [],
        labels: {
          ...service.labels,
          oscar_hub: "true",
        },
      };
      await createServiceApi(modifiedService);
      refreshServices();
			
      alert.success(`Service ${roCrateServiceDef.name} instance deployed`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error deploying ${roCrateServiceDef.name} instance`);
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
					className={className}
          variant={variant}
          tooltipLabel={title}
          onClick={() => {setIsOpen(false)}}
        >
          Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
        <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
            {`${roCrateServiceDef.name}`}
            </span>
        </DialogTitle>
        </DialogHeader>
          <hr></hr>
          <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 overflow-y-auto">
            <div>
              <div className="flex flex-row items-center">
                <Label>
                  Service name
                </Label>
                <Button variant={"link"} size={"icon"}
                  onClick={() => setFormData({ ...formData, name: nameService()})}
                >
                  <RefreshCcwIcon size={16} 
                    onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
                  />
                </Button>
              </div>
              <Input
                id="name"
                placeholder="Enter service name"
                value={formData.name}
                className={errors.name ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: false });
                }}
              ></Input>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <div>
                <Label htmlFor="cpu-cores">CPU Cores</Label>
                <Input
                  id="cpu-cores"
                  type="number"
                  step={0.1}
                  placeholder="Enter CPU Cores"
                  value={formData.cpuCores}
                  className={errors.cpuCores ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, cpuCores: e.target.value });
                    if (errors.cpuCores) setErrors({ ...errors, cpuCores: false });
                  }}
                ></Input>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label htmlFor="memory-ram">RAM</Label>
                    <Input
                      id="memory-ram"
                      type="number"
                      step={formData.memoryUnit === "Gi" ? 1 : 256}
                      placeholder="Enter memory RAM"
                      value={formData.memoryRam}
                      className={errors.memoryRam ? "border-red-500 focus:border-red-500" : ""}
                      onChange={(e) => {
                        setFormData({ ...formData, memoryRam: e.target.value });
                        if (errors.memoryRam) setErrors({ ...errors, memoryRam: false });
                      }}
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
                  onValueChange={(value) => {
                      setFormData({ ...formData, vo: value });
                      if (errors.vo) setErrors({ ...errors, vo: false });
                  }}
                >
                  <SelectTrigger id="vo" className={errors.vo ? "border-red-500 focus:border-red-500" : ""}>
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
						{asyncService && 
            <div>
              <Label>New Bucket</Label>
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
            </div>
						}
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

export default HubServiceConfPopover;
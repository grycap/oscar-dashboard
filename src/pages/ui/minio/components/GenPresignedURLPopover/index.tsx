import { Button } from "@/components/ui/button";
import OscarColors from "@/styles";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alert } from "@/lib/alert";
import { Copy, Share2 } from "lucide-react";
import RequestButton from "@/components/RequestButton";
import { PresignedURIRequest, PresignedURIResponse } from "@/models/presignedURI";
import createPresignedObjectUrlApi from "@/api/buckets/createPresignedObjectUrlApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GenPresignedURLPopoverProps {
  bucketName: string;
  objectKey: string; // Optional prop to pre-fill the object 
  operation: "download" | "upload"; // Optional prop to pre-select the operation
  owerrideButton?: React.ReactNode; // Optional prop to override the default trigger button
}

type EXPIRATION_TIME_UNITS = "sec" | "min" | "hour" | "day";
const EXPIRATION_TIME_UNITS_ARRAY: EXPIRATION_TIME_UNITS[] = ["sec", "min", "hour", "day"];
const EXPIRATION_TIME_LIMIT = 3600*24*7; // 7 days in seconds
const EXPIRATION_TIME = (value: number, unit: EXPIRATION_TIME_UNITS) => {
  switch (unit) {
    case "sec": return value;
    case "min": return value * 60;
    case "hour": return value * 3600;
    case "day": return value * 3600*24;
    default: return 1;
  }
};
const MAX_EXPIRATION_TIME = (unit: EXPIRATION_TIME_UNITS) => {
  switch (unit) {
    case "sec": return EXPIRATION_TIME_LIMIT;
    case "min": return EXPIRATION_TIME_LIMIT / 60;
    case "hour": return EXPIRATION_TIME_LIMIT / 3600;
    case "day": return EXPIRATION_TIME_LIMIT / (3600*24); // 7 days in days
    default: return 1;
  }
};

function GenPresignedURLPopover({ bucketName, objectKey, operation, owerrideButton }: GenPresignedURLPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);


  const [formData, setFormData] = useState({
    object_key: operation === "upload" ? `${objectKey}/` : objectKey,
    operation: operation,
    expires_in: "3600",
    content_type: "",
    timeUnit: EXPIRATION_TIME_UNITS_ARRAY[0],
  });

  const [errors, setErrors] = useState({
    object_key: false,
    operation: false,
    expires_in: false,
  });

  const [presignedUrl, setPresignedUrl] = useState<PresignedURIResponse | null>(null);
  const [dashboardUploadUrl, setDashboardUploadUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        object_key: operation === "upload" ? `${objectKey}/` : objectKey,
        operation: operation,
        expires_in: "3600",
        content_type: "",
        timeUnit: EXPIRATION_TIME_UNITS_ARRAY[0],
      });
      setErrors({
        object_key: false,
        operation: false,
        expires_in: false,
      });
      setPresignedUrl(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    const newErrors = {
      object_key: !formData.object_key || (formData.operation === "upload" && formData.object_key.endsWith("/")), // Object key is required and cannot end with "/" for upload operation
      operation: !formData.operation,
      expires_in: !formData.expires_in || EXPIRATION_TIME(parseInt(formData.expires_in), formData.timeUnit) > EXPIRATION_TIME_LIMIT || parseInt(formData.expires_in) <= 1,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      alert.error("Please fill in all required fields correctly");
      return;
    }

    try {
      const request: PresignedURIRequest = {
        object_key: formData.object_key,
        operation: formData.operation,
        expires_in: EXPIRATION_TIME(parseInt(formData.expires_in), formData.timeUnit),
        content_type: formData.operation === "download" ? "application/octet-stream" : undefined,
      };

      const response = await createPresignedObjectUrlApi(bucketName, request);
      setPresignedUrl(response);
      encodeURIComponent
      setDashboardUploadUrl(`${location.origin}/#/upload?presignedUrl=${encodeURIComponent(response.url)}`);
      alert.success("Presigned URL generated successfully");
    } catch (error) {
      alert.error("Error generating presigned URL");
    }
  };

  const handleCopyUrl = (url: string, message: string) => {
    navigator.clipboard.writeText(url);
    alert.success(message);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {owerrideButton ? owerrideButton : (
        <Button
          variant="link"
          size="icon"
        >
          <Share2 color={OscarColors.Green4} />
        </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
              {`${presignedUrl ? "Generated" : "Generate"} ${operation.charAt(0).toUpperCase() + operation.slice(1)} link`}
            </span>
          </DialogTitle>
        </DialogHeader>
        <hr />

        {!presignedUrl ? (
          <div className="grid grid-cols-1 gap-y-4">
            <div>
              <Label htmlFor="object-key">Object Key</Label>
              <Input
                id="object-key"
                placeholder="e.g., path/to/file.txt"
                value={formData.object_key}
                className={`${errors.object_key ? "border-red-500 focus:border-red-500" : ""} disabled:text-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed`}
                onChange={(e) => {
                  setFormData({ ...formData, object_key: e.target.value });
                  if (errors.object_key) setErrors({ ...errors, object_key: false });
                }}
                disabled={operation === "download"} // Disable editing object key for download operation since it's pre-filled
              />
            </div>

            <div>
              <Label htmlFor="expires-in">Expires In (seconds, max {`${MAX_EXPIRATION_TIME(formData.timeUnit)} ${formData.timeUnit}`})</Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  id="expires-in"
                  type="number"
                  min="1"
                  max={MAX_EXPIRATION_TIME(formData.timeUnit)}
                  placeholder="3600"
                  value={formData.expires_in}
                  className={errors.expires_in ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, expires_in: e.target.value });
                    if (errors.expires_in) setErrors({ ...errors, expires_in: false });
                  }}
                />
                <Select
                  value={formData.timeUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timeUnit: value as EXPIRATION_TIME_UNITS })
                  }
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue id="time-unit" placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_TIME_UNITS_ARRAY.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Default: 3600 seconds (1 hour)</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-4 overflow-y-auto">
            <div>
              <div className="flex flex-row align-items-center gap-2">
                <Label>Generated URL</Label>
                <Copy
                  size={16}
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => handleCopyUrl(presignedUrl.url, "Generated URL copied to clipboard")}
                />

              </div>
              <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 overflow-x-auto whitespace-nowrap text-sm font-mono">
                {presignedUrl.url}
                {/*location.origin + "/#/upload?presignedUrl=" + presignedUrl.url+ "&content-type=application/json&object-key=path/to/file.json"*/}
              </div>
            </div>
            {operation === "upload" && (
            <div>
              <div className="flex flex-row align-items-center gap-2">
                <Label>Dashboard Upload URL</Label> 
                <Copy
                  size={16}
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => handleCopyUrl(dashboardUploadUrl, "Dashboard Upload URL copied to clipboard")}
                />
              </div>
              <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 overflow-x-auto whitespace-nowrap text-sm font-mono">
                {dashboardUploadUrl}
              </div>
            </div>
            )}

            {presignedUrl.expires_at && (
              <div>
                <Label>Expires At</Label>
                <p className="text-sm text-gray-600">{new Date(presignedUrl.expires_at).toLocaleString()}</p>
              </div>
            )}

            {presignedUrl.method && operation == "upload" && (
              <div>
                <Label>HTTP Method</Label>
                <p className="text-sm font-mono font-bold text-blue-600">{presignedUrl.method}</p>
              </div>
            )}

            {presignedUrl.headers && (
              <div>
                <Label>Required Headers</Label>
                <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300">
                  {Object.entries(presignedUrl.headers).map(([key, value]) => (
                    <div key={key} className="text-sm font-mono">
                      <span className="font-bold">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {presignedUrl ? (
            <div className="grid grid-cols-1 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setPresignedUrl(null);
                  isOpen && setIsOpen(false);
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <RequestButton
              className="grid grid-cols-[auto] sm:grid-cols-1 gap-2"
              variant="mainGreen"
              request={handleGenerate}
            >
              Generate
            </RequestButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GenPresignedURLPopover;

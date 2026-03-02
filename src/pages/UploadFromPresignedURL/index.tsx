import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { alert } from "@/lib/alert";
import OscarColors, { ColorWithOpacity } from "@/styles";
import { Link, useSearchParams } from "react-router-dom";

export default function UploadFromPresignedURL() {
  const [file, setFile] = useState<File | null>(null);
  const [isImage, setIsImage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL parameters
  const [presignedURL, setPresignedURL] = useState<string>("");
  const [paramsValid, setParamsValid] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get URL parameters
    const url = searchParams.get("presignedUrl") ?? "";
    if (url ) {
      setPresignedURL(url);
      setParamsValid(true);
    } else {
      window.location.href = "/"; // Redirect to home if parameters are missing
      setParamsValid(false);
    }
  }, [searchParams]);

  const handleUploadFile = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch(presignedURL, {
        method: "PUT",
        body: await file.bytes(),
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      alert.success("File uploaded successfully");
      setFile(null);
      setIsImage(false);
      setIsUploaded(true);
    } catch (error) {
      alert.error("Error uploading file");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFileAndIsImage = (file: File) => {
    setIsImage(file.type.startsWith("image/"));
    setFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFileAndIsImage(droppedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!paramsValid) {
    return null;
  }

  const renderUploadView = () => (
    <div className="grid gap-2 w-[100%]">
      <Label htmlFor="file">{!file || !isImage ? 'Select file' : 'Preview'}</Label>
      <Input
        id="file"
        type="file"
        ref={fileInputRef}
        onChange={(e) =>
          e.target.files && setFileAndIsImage(e.target.files[0])
        }
        className={!file || isImage ? "hidden" : ""}
      />
      {isUploaded ? (
        <div className="bg-green-100 text-green-800 rounded-lg p-4 text-center">
          File uploaded successfully!
        </div>
      ) :
        !file ? ( 
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed cursor-pointer border-gray-300 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2"
        >
          <Upload className="h-8 w-8" />
          Drag and drop your file here or click to open file explorer
          <Button>Select file</Button>
        </div>
      ) : (
        isImage ?
        <div className="bg-muted rounded-lg w-[100%]">
          <div className="mb-4">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed cursor-pointer border-gray-300 rounded-lg text-center flex flex-col items-center justify-center"
            >
              <img
                src={URL.createObjectURL(file)}
                alt="Uploaded file"
                className="max-w-full h-auto max-h-[200px] rounded"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="flex font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({formatFileSize(file.size)})
              </span>
            </div>
          </div>
        </div>
        : ''
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4 flex-col"
      style={{
        backgroundColor: ColorWithOpacity(OscarColors.Green1, 0.75),
      }}
    >
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        style={{
          zIndex: 1,
        }}
        >
        <div className="mb-6 mt-[-10px]">
          <h1 className="text-2xl font-bold " style={{ color: OscarColors.DarkGrayText }}>
            External File Upload
          </h1>
          <hr/>
          <p className="text-sm text-gray-600 mt-2">
            File: <span className="font-mono font-semibold">{presignedURL.split("?")[0].split("/").pop()}</span>
          </p>
        </div>

        <div className="grid gap-4">
          {renderUploadView()}  
          <div className="flex justify-end space-x-2">
            {isUploaded ? (
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploaded(false);
                }}
              >
                Back
              </Button>
            ) :
            (<>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setIsImage(false);
                }}
                disabled={isLoading}
              >
                Clear
              </Button>
              <Button
                onClick={handleUploadFile}
                disabled={!file || isLoading}
                style={{ backgroundColor: OscarColors.Green4 }}
                className="text-white"
              >
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
            </>
            )}
            
          </div>
        </div>
        
      </div>
      {/* SUBs */}
      <div
        className="w-full max-w-md m-[-10px]"
        style={{
          background: "#FFFFFF50",
          border: `1px solid ${OscarColors.Green1}`,
          borderRadius: "0 0 30px 30px",
          zIndex: 0,
          height: "50px",
        }}
      >
        <div
          style={{
            height: "20px",
          }}
        ></div>
        
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "10px",
            color: "rgba(0,0,0,0.5)",
            padding: "0 20px",
          }}
        >
          <div>
            Powered by <a href="https://oscar.grycap.net">OSCAR</a>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/terms-of-use">Terms of use</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

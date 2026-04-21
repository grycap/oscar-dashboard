"use client";

import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Editor from "@monaco-editor/react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  Trash2,
  ArrowRight,
  Terminal,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useServicesContext from "../../context/ServicesContext";
import { Service } from "../../models/service";
import { alert } from "@/lib/alert";
import OscarColors from "@/styles";
import { useAuth } from "@/contexts/AuthContext";
import RequestButton from "@/components/RequestButton";
import invokeServiceSync from "@/api/invoke/invokeServiceSync";
import {
  decodeBase64ToBytes,
  detectBinaryMimeType,
  extractBase64Payload,
} from "@/lib/utils";
import { getMimeTypeFromPath } from "@/lib/mimeType";
import { errorMessage } from "@/lib/error";

type View = "upload" | "editor" | "response";
type ResponseType = "text" | "image" | "file" | "zip";
type ZipPreviewType = "text" | "image" | "pdf" | "other";

interface ZipEntryPreview {
  name: string;
  mimeType: string;
  previewType: ZipPreviewType;
}

interface Props {
  service?: Service;
  triggerRenderer?: React.ReactNode;
}

export function InvokePopover({ service, triggerRenderer }: Props) {
  const { formService } = useServicesContext();
  const { authData } = useAuth();
  const currentService = service ?? formService;

  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileType, setFileType] = useState<"text" | "image" | null>(null);
  const [currentView, setCurrentView] = useState<View>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("plaintext");
  const [response, setResponse] = useState<string>("");
  const [responsePayloadBase64, setResponsePayloadBase64] = useState<string>("");
  const [responsePayloadMimeType, setResponsePayloadMimeType] = useState<string>("");
  const [responseDownloadUrl, setResponseDownloadUrl] = useState<string>("");
  const [responseDownloadName, setResponseDownloadName] = useState<string>("");
  const [zipArchive, setZipArchive] = useState<JSZip | null>(null);
  const [zipEntries, setZipEntries] = useState<ZipEntryPreview[]>([]);
  const [selectedZipEntryName, setSelectedZipEntryName] = useState<string>("");
  const [zipPreviewType, setZipPreviewType] = useState<ZipPreviewType>("other");
  const [zipPreviewText, setZipPreviewText] = useState<string>("");
  const [zipPreviewUrl, setZipPreviewUrl] = useState<string>("");
  const [zipPreviewLoading, setZipPreviewLoading] = useState<boolean>(false);

  const [responseType, setResponseType] = useState<ResponseType>("text");

  const getBlobData = (bytes: Uint8Array) =>
    bytes.buffer instanceof ArrayBuffer
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : Uint8Array.from(bytes).buffer;

  const getZipEntryPreviewType = (mimeType: string): ZipPreviewType => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml" ||
      mimeType === "application/yaml" ||
      mimeType === "application/javascript"
    ) {
      return "text";
    }
    return "other";
  };

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);

    if (uploadedFile.type === "application/json") {
      setFileType("text");
      setSelectedLanguage("json");
    } else if (
      uploadedFile.type === "application/x-yaml" ||
      uploadedFile.type === "text/yaml" ||
      uploadedFile.name.endsWith(".yaml") ||
      uploadedFile.name.endsWith(".yml")||
      uploadedFile.name.endsWith(".npy") ||
      uploadedFile.name.endsWith(".gzip") ||
      uploadedFile.name.endsWith(".tar") ||
      uploadedFile.name.endsWith(".rar") ||
      uploadedFile.name.endsWith(".tar.gz") ||
      uploadedFile.name.endsWith(".7z")
    ) {
      setFileType("text");
      setSelectedLanguage("yaml");
    } else if (uploadedFile.type.startsWith("image/")) {
      setFileType("image");
    } else {
      alert.error("File type not supported");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
    };
    reader.readAsText(uploadedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  const invokeService = async () => {
    const modifiedFile = new File([fileType === "image" ? file! : fileContent], file?.name ?? "file.txt", {
      type: file?.type ?? "text/plain",
    });
    if (modifiedFile.size === 0) {return;}
    try {
      const token = authData.token ?? currentService?.token;
      const responseLocal = await invokeServiceSync({
        file: modifiedFile,
        serviceName: currentService?.name,
        token,
        endpoint: authData.endpoint,
      });
      const responseString = responseLocal as string;
      setResponse(responseString);
      setResponsePayloadBase64("");
      setResponsePayloadMimeType("");
      setResponseDownloadName("");
      setZipArchive(null);
      setZipEntries([]);
      setSelectedZipEntryName("");

      if (responseString.trim() !== "") {
        if (responseString.startsWith("data:image/")) {
          const [dataUriPrefix, dataUriPayload = ""] = responseString.split(",");
          const mimeType = dataUriPrefix
            .replace(/^data:/, "")
            .replace(/;base64$/, "");
          setResponsePayloadBase64(dataUriPayload);
          setResponsePayloadMimeType(mimeType);
          setResponseType("image");
        } else {
          const base64Payload = extractBase64Payload(responseString);
          const bytes = base64Payload
            ? decodeBase64ToBytes(base64Payload)
            : null;
          const mimeType = bytes ? detectBinaryMimeType(bytes) : null;

          if (
            base64Payload &&
            bytes &&
            mimeType &&
            mimeType !== "application/octet-stream"
          ) {
            setResponsePayloadBase64(base64Payload);
            setResponsePayloadMimeType(mimeType);
            if (mimeType === "application/zip") {
              setResponseDownloadName(`${currentService?.name ?? "response"}.zip`);
              setResponseType("zip");
            } else if (mimeType.startsWith("image/")) {
              setResponseType("image");
            } else {
              const extension =
                mimeType === "application/pdf"
                  ? "pdf"
                  : mimeType.startsWith("text/")
                    ? "txt"
                    : "bin";
              setResponseDownloadName(
                `${currentService?.name ?? "response"}.${extension}`
              );
              setResponseType("file");
            }
          } else {
            setResponseType("text");
          }
        }
      }
      setCurrentView("response");
    } catch (error) {
      alert.error(`Error invoking service: ${errorMessage(error)}`);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileType(null);
    setFileContent("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const renderUploadView = () => (
    <div className="grid grid-cols-1 w-full">
      {!file ? (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files[0])
            }
            className="hidden"
            accept="image/*,.json,.yaml,.yml"
          />
          <div className="grid grid-cols-1 grid-rows-[1fr_auto] gap-2">
            <div className="h-full my-auto border-2 border-dashed cursor-pointer border-gray-300 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8" />
              Drag and drop your file here or click to open file explorer
              <Button>Upload file</Button>
            </div>
            <div className="flex justify-center items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView("editor");
                  setFile(null);
                  setFileType(null);
                }}
              >
                Or use the code editor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 grid-rows-[auto_1fr] bg-muted rounded-lg w-full h-full ">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {fileType === "image" ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({formatFileSize(file.size)})
              </span>
            </div>
            {fileType === "text" && (
              <Button
                variant="outline"
                onClick={() => setCurrentView("editor")}
              >
                Edit in code editor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={removeFile}>
              <Trash2 className="h-4 w-4 mr-2" /> Remove
            </Button>
          </div>
          {fileType === "image" && (
            <div className="grid grid-cols-1 grid-rows-[auto_1fr] mt-4">
              <h4 className="text-md font-semibold mb-2">Preview</h4>
              <img
                src={URL.createObjectURL(file)}
                alt="Uploaded file"
                className="max-w-full h-auto max-h-[200px] rounded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (response) {
    console.log("Response:", response);
  }

  const [responseFileContent, setResponseFileContent] = useState<string>("");
  useEffect(() => {
    if (!responsePayloadBase64) {
      setResponseFileContent("");
      return;
    }

    const bytes = decodeBase64ToBytes(responsePayloadBase64);
    if (!bytes) {
      setResponseFileContent(response);
      return;
    }

    if (responseType === "file") {
      try {
        const decodedContent = new TextDecoder().decode(bytes);
        setResponseFileContent(decodedContent);
      } catch (error) {
        setResponseFileContent("Binary file ready to download.");
      }
    }

    if (responseType === "zip") {
      setResponseFileContent("ZIP file ready to download.");
    }
  }, [response, responsePayloadBase64, responseType]);

  useEffect(() => {
    if (!responsePayloadBase64 || !responsePayloadMimeType) {
      if (responseDownloadUrl) {
        URL.revokeObjectURL(responseDownloadUrl);
      }
      setResponseDownloadUrl("");
      return;
    }

    const bytes = decodeBase64ToBytes(responsePayloadBase64);
    if (!bytes) {
      return;
    }

    const blobData = getBlobData(bytes);
    const blob = new Blob([blobData], { type: responsePayloadMimeType });
    const nextUrl = URL.createObjectURL(blob);

    setResponseDownloadUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [responsePayloadBase64, responsePayloadMimeType]);

  useEffect(() => {
    if (responsePayloadMimeType !== "application/zip" || !responsePayloadBase64) {
      setZipArchive(null);
      setZipEntries([]);
      setSelectedZipEntryName("");
      return;
    }

    let isMounted = true;

    async function loadZipArchive() {
      const bytes = decodeBase64ToBytes(responsePayloadBase64);
      if (!bytes) return;

      const archive = await JSZip.loadAsync(getBlobData(bytes));
      const entries = Object.values(archive.files)
        .filter((entry) => !entry.dir)
        .map((entry) => {
          const mimeType = getMimeTypeFromPath(entry.name) || "application/octet-stream";
          return {
            name: entry.name,
            mimeType,
            previewType: getZipEntryPreviewType(mimeType),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!isMounted) return;

      setZipArchive(archive);
      setZipEntries(entries);
      setSelectedZipEntryName((current) =>
        current && entries.some((entry) => entry.name === current)
          ? current
          : (entries[0]?.name ?? "")
      );
    }

    loadZipArchive().catch((error) => {
      console.error("Error parsing ZIP response:", error);
      if (!isMounted) return;
      setZipArchive(null);
      setZipEntries([]);
      setSelectedZipEntryName("");
    });

    return () => {
      isMounted = false;
    };
  }, [responsePayloadBase64, responsePayloadMimeType]);

  useEffect(() => {
    setZipPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return "";
    });

    if (!zipArchive || !selectedZipEntryName) {
      setZipPreviewText("");
      setZipPreviewType("other");
      return;
    }

    let isMounted = true;
    const currentArchive = zipArchive;
    setZipPreviewLoading(true);

    async function loadZipEntryPreview() {
      const entry = currentArchive.file(selectedZipEntryName);
      const entryMeta = zipEntries.find((item) => item.name === selectedZipEntryName);
      if (!entry || !entryMeta) {
        if (!isMounted) return;
        setZipPreviewType("other");
        setZipPreviewText("");
        setZipPreviewLoading(false);
        return;
      }

      if (entryMeta.previewType === "text") {
        const text = await entry.async("text");
        if (!isMounted) return;

        if (entryMeta.mimeType === "application/json") {
          try {
            setZipPreviewText(JSON.stringify(JSON.parse(text), null, 2));
          } catch (_error) {
            setZipPreviewText(text);
          }
        } else {
          setZipPreviewText(text);
        }

        setZipPreviewType("text");
        setZipPreviewLoading(false);
        return;
      }

      if (entryMeta.previewType === "image" || entryMeta.previewType === "pdf") {
        const bytes = await entry.async("uint8array");
        if (!isMounted) return;

        const url = URL.createObjectURL(
          new Blob([getBlobData(bytes)], { type: entryMeta.mimeType })
        );
        setZipPreviewUrl(url);
        setZipPreviewText("");
        setZipPreviewType(entryMeta.previewType);
        setZipPreviewLoading(false);
        return;
      }

      if (!isMounted) return;
      setZipPreviewType("other");
      setZipPreviewText("");
      setZipPreviewLoading(false);
    }

    loadZipEntryPreview().catch((error) => {
      console.error("Error loading ZIP entry preview:", error);
      if (!isMounted) return;
      setZipPreviewType("other");
      setZipPreviewText("");
      setZipPreviewLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedZipEntryName, zipArchive, zipEntries]);

  const handleDownloadResponse = () => {
    if (!responseDownloadUrl) return;

    const anchor = document.createElement("a");
    anchor.href = responseDownloadUrl;
    anchor.download = responseDownloadName || `${currentService?.name ?? "response"}.bin`;
    anchor.click();
  };

  const handleDownloadZipEntry = async () => {
    if (!zipArchive || !selectedZipEntryName) return;

    const entry = zipArchive.file(selectedZipEntryName);
    if (!entry) return;

    const bytes = await entry.async("uint8array");
    const mimeType =
      zipEntries.find((item) => item.name === selectedZipEntryName)?.mimeType ||
      "application/octet-stream";
    const url = URL.createObjectURL(
      new Blob([getBlobData(bytes)], { type: mimeType })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = selectedZipEntryName.split("/").pop() || "download";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const renderEditorView = () => (
    <div className="grid grid-cols-1 grid-rows-[auto_1fr] w-full gap-2">
      <div className="flex justify-between items-start gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentView("upload")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
        </Button>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plaintext">Plain Text</SelectItem>
            <SelectItem value="yaml">YAML</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Editor
        height="100%"
        width="100%"
        language={selectedLanguage}
        value={fileContent}
        onChange={handleEditorChange}
        options={{ minimap: { enabled: false } }}
      />
    </div>
  );

  const renderResponseView = () => {
    return (
      <div className="grid grid-cols-1 grid-rows-[auto_1fr] w-full gap-2">
        <Select
          value={responseType}
          onValueChange={(value) =>
            setResponseType(value as ResponseType)
          }
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Select a response type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            {responsePayloadMimeType.startsWith("image/") && (
              <SelectItem value="image">Image</SelectItem>
            )}
            {responsePayloadMimeType === "application/zip" && (
              <SelectItem value="zip">ZIP</SelectItem>
            )}
            {responsePayloadMimeType &&
              responsePayloadMimeType !== "application/zip" &&
              !responsePayloadMimeType.startsWith("image/") && (
                <SelectItem value="file">File</SelectItem>
              )}
          </SelectContent>
        </Select>
        <div className="h-full">
          {responseType === "text" && (
            <div
              style={{
                overflow: "auto",
                padding: "0px 10px",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                maxHeight: "75vh",
              }}
            >
              {response}
            </div>
          )}
          {responseType === "image" && (
            <img
              src={`data:${responsePayloadMimeType || "image/png"};base64,${responsePayloadBase64}`}
              alt="Response"
            />
          )}
          {responseType === "file" && (
            <div
              style={{
                padding: "0px 10px",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {responseFileContent}
              {responseDownloadUrl && (
                <div className="mt-4">
                  <Button variant="outline" onClick={handleDownloadResponse}>
                    <Download className="h-4 w-4 mr-2" />
                    Download file
                  </Button>
                </div>
              )}
            </div>
          )}
          {responseType === "zip" && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-full min-h-0">
              <div className="border rounded-md overflow-hidden min-h-[220px]">
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <div>
                    <p className="font-medium">ZIP contents</p>
                    <p className="text-xs text-muted-foreground">
                      {zipEntries.length} files
                    </p>
                  </div>
                  {responseDownloadUrl && (
                    <Button variant="outline" size="sm" onClick={handleDownloadResponse}>
                      <Download className="h-4 w-4 mr-2" />
                      ZIP
                    </Button>
                  )}
                </div>
                <div className="max-h-[50vh] overflow-auto">
                  {zipEntries.map((entry) => (
                    <button
                      key={entry.name}
                      type="button"
                      className={`w-full text-left px-3 py-2 border-b hover:bg-muted/50 ${
                        selectedZipEntryName === entry.name ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedZipEntryName(entry.name)}
                    >
                      <div className="font-medium truncate">
                        {entry.name.split("/").pop() || entry.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {entry.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border rounded-md min-h-[220px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <div>
                    <p className="font-medium">Preview</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedZipEntryName || "Select a file from the ZIP"}
                    </p>
                  </div>
                  {selectedZipEntryName && (
                    <Button variant="outline" size="sm" onClick={handleDownloadZipEntry}>
                      <Download className="h-4 w-4 mr-2" />
                      File
                    </Button>
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-3">
                  {!selectedZipEntryName && (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Select a file to preview it before downloading.
                    </div>
                  )}
                  {selectedZipEntryName && zipPreviewLoading && (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Loading preview...
                    </div>
                  )}
                  {selectedZipEntryName && !zipPreviewLoading && zipPreviewType === "text" && (
                    <pre className="whitespace-pre-wrap break-words text-sm">
                      {zipPreviewText}
                    </pre>
                  )}
                  {selectedZipEntryName && !zipPreviewLoading && zipPreviewType === "image" && zipPreviewUrl && (
                    <div className="h-full flex items-center justify-center">
                      <img
                        src={zipPreviewUrl}
                        alt={selectedZipEntryName}
                        className="max-h-[52vh] w-auto rounded"
                      />
                    </div>
                  )}
                  {selectedZipEntryName && !zipPreviewLoading && zipPreviewType === "pdf" && zipPreviewUrl && (
                    <iframe
                      src={zipPreviewUrl}
                      title={selectedZipEntryName}
                      className="w-full h-[52vh] border-0"
                    />
                  )}
                  {selectedZipEntryName && !zipPreviewLoading && zipPreviewType === "other" && (
                    <div className="h-full flex items-center justify-center text-center text-muted-foreground px-6">
                      Preview is not available for this file type. You can still
                      download the selected file or the full ZIP.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const resetForm = () => {
    setFile(null);
    setFileContent("");
    setFileType(null);
    setCurrentView("upload");
    setSelectedLanguage("plaintext");
    setResponse("");
    setResponsePayloadBase64("");
    setResponsePayloadMimeType("");
    setResponseDownloadName("");
    setZipArchive(null);
    setZipEntries([]);
    setSelectedZipEntryName("");
    setZipPreviewType("other");
    setZipPreviewText("");
    setZipPreviewLoading(false);
    if (zipPreviewUrl) {
      URL.revokeObjectURL(zipPreviewUrl);
    }
    setZipPreviewUrl("");
    if (responseDownloadUrl) {
      URL.revokeObjectURL(responseDownloadUrl);
    }
    setResponseDownloadUrl("");
    setResponseType("text");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerRenderer ?? (
          <Button variant="outline">
            <Terminal className="h-4 w-4 mr-2" />
            Invoke
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="grid grid-cols-1 grid-rows-[auto_1fr_auto] w-screen sm:w-[70%] 2xl:w-[60%] h-[90%] sm:h-[80%] 2xl:h-[60%] overflow-y-auto gap-5">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
              {`Invoke service: `}
            </span>
            {currentService?.name}
          </DialogTitle>
        </DialogHeader>
        {currentView === "upload" && renderUploadView()}
        {currentView === "editor" && renderEditorView()}
        {currentView === "response" && renderResponseView()}
        <div className="grid grid-cols-1 sm:grid-cols-[auto] sm:justify-end">
          {currentView !== "response" ? (
            <RequestButton variant="mainGreen" request={invokeService}>
              Invoke Service
            </RequestButton>
          ) : (
            <Button variant="outline" onClick={() => resetForm()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go back
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

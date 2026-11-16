import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import { Copy } from "lucide-react";
import { Service } from "../../../models/service";

interface ImageCellProps {
  service: Service;
}

function ImageCell({ service }: ImageCellProps) {
  async function handleCopyImage(image: string) {
    try {
      await navigator.clipboard.writeText(image);
      alert.success("Image copied to clipboard");
    } catch (error) {
      alert.error(`Error copying image: ${errorMessage(error)}`);
      console.error(error);
    }
  }

  const runtimeImage =
    service.model_serving?.inference?.runtime_image ||
    service.model_serving?.llm_inference?.runtime_image ||
    (service.model_serving?.llm_inference ? "default" : undefined);
  const source =
    service.model_serving?.inference?.source ||
    service.model_serving?.llm_inference?.source;
  const images = [
    { label: "Docker", value: service.image },
    { label: "Model Runtime", value: runtimeImage },
    { label: "Source", value: source },
  ].filter((image): image is { label: string; value: string } => Boolean(image.value));

  return (
    <div className="grid w-fit min-w-[250px] max-w-full grid-cols-[4rem_minmax(0,_max-content)] gap-x-0 gap-y-1">
      {images.map(({ label, value }) => (
        <div key={label} className="contents">
          <span className="self-center text-xs text-muted-foreground">{label}</span>
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              title={value}
              aria-label={`Copy ${label} image: ${value}`}
              onClick={() => handleCopyImage(value)}
              className="inline-flex w-full min-w-0 max-w-[250px] items-center rounded-md border border-border bg-muted/70 px-2 py-1 text-left font-mono text-xs text-gray-700 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-300"
            >
              <span className="block min-w-0 truncate">{value}</span>
            </button>
            <Copy aria-hidden="true" className="h-3 w-3 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImageCell;
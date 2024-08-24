import {
  MinioStorageProvider,
  StorageProvider,
} from "@/pages/ui/services/models/service";
import OscarColors, { OscarStyles } from "@/styles";
import minioLogo from "@/assets/logos/minio.png";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface Props {
  provider: StorageProvider;
}

function ProvidersListItem({ provider }: Props) {
  function getImage() {
    switch (provider.type) {
      case "minio":
        return minioLogo;
      default:
        return undefined;
    }
  }

  function getSubtitle() {
    switch (provider.type) {
      case "minio":
        const minioProvider = provider as MinioStorageProvider;
        return minioProvider.endpoint;
      default:
        return undefined;
    }
  }

  return (
    <div
      style={{
        flexGrow: 1,
        maxWidth: "32.8%",
        height: 72,
        border: OscarStyles.border,
        background: "white",
        borderRadius: 8,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 16,
        padding: 10,
        paddingLeft: 14,
      }}
    >
      <img
        src={getImage()}
        alt="Provider logo"
        style={{
          width: "30%",
        }}
      />

      <div
        style={{
          flexGrow: 1,
          flexBasis: 0,
          overflow: "hidden",
        }}
      >
        <h1
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {provider.id}
        </h1>
        <h2
          style={{
            color: OscarColors.DarkGrayText,
            maxWidth: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {getSubtitle()}
        </h2>
      </div>
      <Button
        style={{
          minWidth: 40,
          height: 40,
        }}
        size="icon"
        variant={"ghost"}
      >
        <Edit />
      </Button>
    </div>
  );
}

export default ProvidersListItem;
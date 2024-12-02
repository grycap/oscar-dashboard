import { alert } from "@/lib/alert";
import { Copy, Eye } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  label: string;
  value: string;
  isPassword?: boolean;
  enableCopy?: boolean;
}

function InfoItem({
  label,
  value,
  isPassword = false,
  enableCopy = false,
}: Props) {
  const [isRevealed, setIsRevealed] = useState(false);

  const displayedValue = useMemo(() => {
    if (!isPassword) return value;
    return isRevealed ? value : "**********************";
  }, [isRevealed, isPassword, value]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    alert.success(label + " copied to clipboard");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        whiteSpace: "pre-wrap",
        flexWrap: "wrap",
      }}
    >
      <h2 style={{ fontSize: "13px", fontWeight: "500" }}>{label}</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          columnGap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            maxWidth: "30vw",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {displayedValue}
        </div>

        {isPassword && (
          <Eye
            size={16}
            style={{
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRevealed(!isRevealed);
            }}
          />
        )}
        {enableCopy && (
          <Copy
            size={16}
            style={{
              cursor: "pointer",
              marginTop: !isPassword ? "3px" : undefined,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopy();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default InfoItem;

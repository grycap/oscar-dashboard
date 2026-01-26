import { alert } from "@/lib/alert";
import { Copy, ExternalLink, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  label: string;
  value: string;
  isPassword?: boolean;
  enableCopy?: boolean;
  displayLabel?: boolean;
  link?: {url?: string, enableRedirectIcon: boolean;};
}

function InfoItem({
  label,
  value,
  isPassword = false,
  enableCopy = false,
  displayLabel = true,
  link = {enableRedirectIcon: false},
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
    <div className="grid grid-cols-[1fr_auto] gap-4" 
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <h2 style={{ fontSize: "13px", fontWeight: "500" }}>
        {displayLabel ? label : ''}
      </h2>
      <div className={"flex flex-row break-words text-right"}
        style={{
          alignItems: "center",
          columnGap: "16px",
        }}
      >
        <div className="min-w-0 break-all text-right"
          style={{
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          {!link.url ? displayedValue :
            <Link style={{ textDecoration: 'none' }} to={link.url} target="_blank">{displayedValue}</Link>
          }
        </div>

        {isPassword && (
          <Eye
            size={16}
            className="flex-shrink-0"
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
        {link.url && link.enableRedirectIcon && (
          <Link
            to={link.url}
            target="_blank"
          >
            <ExternalLink 
              size={16}
              className="flex-shrink-0"
              style={{
                cursor: "pointer",
              }}
            />
          </Link>
        )}
        {enableCopy && (
          <Copy
            size={16}
            className="flex-shrink-0"
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

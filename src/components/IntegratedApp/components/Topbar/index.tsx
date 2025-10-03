import UserInfo from "@/components/UserInfo";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import OscarColors, { OscarStyles } from "@/styles";
import { RefreshCcwIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface IntegratedAppProps {
    appName: string;
    DeployInstancePopover: React.ComponentType;
}

function IntegratedAppTopbar({ appName, DeployInstancePopover }: IntegratedAppProps) {
  const { refreshServices } = useServicesContext();
  return (
    <div
      style={{
        borderBottom: OscarStyles.border,
      }}
      className="grid grid-cols-[1fr_auto] h-[64px]"
    >
      <div
        style={{
          padding: "0 16px",
        }}
        className={"grid items-center justify-between gap-2 grid-cols-[auto_auto]"}
      >
        <div className="flex flex-row items-center gap-3">
          <Link
              to=""
              style={{
                color: OscarColors.DarkGrayText,
                fontSize: 18,
                textDecoration: "none",
              }}
          >{appName}</Link>
        
          <Link to=""
              onClick={() => refreshServices()}
          >
            <RefreshCcwIcon size={18} 
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
            />
          </Link>
        </div>
        <DeployInstancePopover />
      </div>
      <UserInfo />
    </div>
  );
}

export default IntegratedAppTopbar;

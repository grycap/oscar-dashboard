import UserInfo from "@/components/UserInfo";
import OscarColors, { OscarStyles } from "@/styles";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface GenericTopbarProps {
    customHeader?: React.ReactNode;
    defaultHeader?: {title: string, linkTo: string};
    refresher?: () => void;
    children?: React.ReactNode;
    secondaryRow?: React.ReactNode;
    triggerRefresherAtLoad?: boolean; // trigger refresher on load the component
}

function GenericTopbar({ customHeader, defaultHeader, refresher, children, secondaryRow, triggerRefresherAtLoad = true }: GenericTopbarProps) {
  const location = useLocation();

  useEffect(() => {
    triggerRefresherAtLoad && refresher && refresher();
  }, []);
  
  return (
    <div className={`${secondaryRow ? "grid grid-rows-[auto_auto]" : "grid grid-rows-[auto]"} items-center w-full`}>
      <div className="grid grid-cols-[auto_1fr_auto] w-full h-[69px] items-center gap-4 pl-4" style={{borderBottom: OscarStyles.border}}>
        {customHeader ?? (
        defaultHeader ? (
        <div className="flex flex-row items-center gap-2">
          <Link
            to={defaultHeader.linkTo}
            style={{
              color: OscarColors.DarkGrayText,
              fontSize: 18,
              textDecoration: "none",
            }}
          >{defaultHeader.title}</Link>
          
          {defaultHeader && location.pathname === defaultHeader.linkTo && refresher && (
          <Link to=""
            onClick={() => refresher()}
          >
            <RefreshCcwIcon size={16} 
              onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
              onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
            />
          </Link>)
          }
        </div>
        ) : <div></div>
        )}

        <div className="">
          {children}
        </div>
        
        <div 
          style={{borderLeft: OscarStyles.border}}
          className="flex flex-row items-center h-full min-w-max"
        >
          <UserInfo />
        </div>

      </div>
      {secondaryRow && (
      <div className="flex flex-row">
        {secondaryRow}
      </div>
      )}
    </div>
  );
}

export default GenericTopbar;

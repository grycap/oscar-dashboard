import { OscarStyles } from "@/styles";
import { ServiceFormTab } from "../../../models/service";
import { Dispatch, SetStateAction } from "react";

interface Props {
  tab: ServiceFormTab;
  setTab: Dispatch<SetStateAction<ServiceFormTab>>;
}

function ServiceFormTabs({ tab: activeTab, setTab }: Props) {
  return (
    <div
      style={{
        background: "white",
        borderBottom: OscarStyles.border,
        display: "flex",
        flexDirection: "row",
        padding: "0 16px",
      }}
    >
      {Object.keys(ServiceFormTab)
        .filter((tab) => isNaN(Number(tab)))
        .map((tab, i) => {
          const isSelected = tab === ServiceFormTab[activeTab];
          return (
            <div
              style={{
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                borderBottom: isSelected ? `1px solid black` : "none",
                cursor: "pointer",
              }}
              onClick={() =>
                setTab(ServiceFormTab[tab as keyof typeof ServiceFormTab])
              }
              key={tab}
            >
              {tab}
            </div>
          );
        })}
    </div>
  );
}

export default ServiceFormTabs;

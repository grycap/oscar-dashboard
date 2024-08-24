import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useServicesContext from "../../../context/ServicesContext";
import { ServiceOrderBy } from "../../../models/service";
import {
  ArrowDownIcon,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from "lucide-react";
import { SelectIcon } from "@radix-ui/react-select";
import { useMediaQuery } from "react-responsive";

function ServicesOrderBy() {
  const { orderBy, setOrderBy } = useServicesContext();
  const isSmallScreen = useMediaQuery({ maxWidth: 899 });

  const direction = orderBy.includes("asc") ? "asc" : "desc";

  return (
    <Select
      value={orderBy}
      onValueChange={(value: ServiceOrderBy) => {
        setOrderBy(value);
      }}
    >
      <SelectTrigger className="w-max">
        <SelectIcon>
          {direction === "asc" ? (
            <ArrowDownNarrowWide className="w-4 h-4 mr-2" />
          ) : (
            <ArrowDownWideNarrow className="w-4 h-4 mr-2" />
          )}
        </SelectIcon>
        {!isSmallScreen && <SelectValue>{orderBy.split(" ")[0]}</SelectValue>}
      </SelectTrigger>
      <SelectContent className="w-[200px]">
        <SelectGroup>
          <SelectLabel>Order by</SelectLabel>
          {Object.values(ServiceOrderBy).map((value) => {
            return (
              <SelectItem key={value} value={value}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {value}
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default ServicesOrderBy;

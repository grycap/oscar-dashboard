import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useServicesContext from "../../../context/ServicesContext";
import { ServiceOrderBy } from "../../../models/service";

function ServicesOrderBy() {
  const { orderBy, setOrderBy } = useServicesContext();

  return (
    <Select
      value={orderBy}
      onValueChange={(value: ServiceOrderBy) => {
        setOrderBy(value);
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Order by" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(ServiceOrderBy).map((value) => {
          const isSelected = value === orderBy;
          return (
            <SelectItem key={value} value={value}>
              {isSelected && "Order by "}
              {value}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default ServicesOrderBy;

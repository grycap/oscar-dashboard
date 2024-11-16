import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import useServicesContext from "../../../context/ServicesContext";
import { ServiceFilterBy } from "../../../models/service";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Filter } from "lucide-react";
import { SelectIcon } from "@radix-ui/react-select";

function ServicesFilterBy() {
  const { filter, setFilter } = useServicesContext();
  const [inputValue, setInputValue] = useState(filter.value);
  const isSmallScreen = useMediaQuery({ maxWidth: 1099 });

  // Debounce the input value to avoid unnecessary re-renders
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilter((prev) => ({
        ...prev,
        value: inputValue,
      }));
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [inputValue]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
      }}
    >
      <Select
        value={filter.type}
        onValueChange={(value: ServiceFilterBy) => {
          setFilter((prev) => ({
            ...prev,
            type: value,
          }));
        }}
      >
        <SelectTrigger className="w-max">
          <SelectIcon>
            <Filter size={16} className="mr-2" />
          </SelectIcon>
          {/* <SelectValue placeholder="Filter by" /> */}
        </SelectTrigger>
        <SelectContent>
          {Object.values(ServiceFilterBy).map((value) => {
            return (
              <SelectItem key={value} value={value}>
                {"By " + value.toLocaleLowerCase()}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Input
        placeholder={"Filter by " + filter.type.toLocaleLowerCase()}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        endIcon={<Search size={16} />}
        style={{ maxWidth: 300, minWidth: isSmallScreen ? 100 : 150 }}
      />
    </div>
  );
}

export default ServicesFilterBy;

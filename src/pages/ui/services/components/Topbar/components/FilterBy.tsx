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
import { Checkbox } from "@/components/ui/checkbox";
import Divider from "@/components/ui/divider";

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
      className="grid grid-cols-[auto_1fr] w-full items-center gap-2"
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
            if (value === ServiceFilterBy.Visibility) {
              return null; // We handle visibility with separate checkboxes, so we skip it in the dropdown
            }
            return (
              <SelectItem key={value} value={value}>
                {"By " + value.toLocaleLowerCase()}
              </SelectItem>
            );
          })}
          <Divider />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px",
            }}
          >
            <Checkbox
              id="privateItems"
              checked={filter.onlyPrivate}
              onCheckedChange={(checked) => {
                setFilter((prev) => ({
                  ...prev,
                  onlyPrivate: checked as boolean,
                  onlyPublic: false,
                  onlyRestricted: false,
                }));
              }}
              style={{ fontSize: 16 }}
            />
            <label
              htmlFor="privateItems"
              style={{ fontSize: 14, marginTop: "1px" }}
            >
              Private Svc.
            </label>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px",
            }}
          >
            <Checkbox
              id="publicItems"
              checked={filter.onlyPublic}
              onCheckedChange={(checked) => {
                setFilter((prev) => ({
                  ...prev,
                  onlyPublic: checked as boolean,
                  onlyPrivate: false,
                  onlyRestricted: false,
                }));
              }}
              style={{ fontSize: 16 }}
            />
            <label
              htmlFor="publicItems"
              style={{ fontSize: 14, marginTop: "1px" }}
            >
              Public Svc.
            </label>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px",
            }}
          >
            <Checkbox
              id="restrictedItems"
              checked={filter.onlyRestricted}
              onCheckedChange={(checked) => {
                setFilter((prev) => ({
                  ...prev,
                  onlyRestricted: checked as boolean,
                  onlyPrivate: false,
                  onlyPublic: false,
                }));
              }}
              style={{ fontSize: 16 }}
            />
            <label
              htmlFor="restrictedItems"
              style={{ fontSize: 14, marginTop: "1px" }}
            >
              Restricted Svc.
            </label>
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px",
            }}
          >
            <Checkbox
              id="ownedItems"
              checked={filter.onlyOwned}
              onCheckedChange={(checked) => {
                setFilter((prev) => ({
                  ...prev,
                  onlyOwned: checked as boolean,
                }));
              }}
              style={{ fontSize: 16 }}
            />
            <label
              htmlFor="ownedItems"
              style={{ fontSize: 14, marginTop: "1px" }}
            >
              My services
            </label>
          </div>
        </SelectContent>
      </Select>
      <Input
        placeholder={"Filter by " + filter.type.toLocaleLowerCase()}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        endIcon={<Search size={16} />}
        style={{ minWidth: isSmallScreen ? 100 : 150 }}
      />
    </div>
  );
}

export default ServicesFilterBy;

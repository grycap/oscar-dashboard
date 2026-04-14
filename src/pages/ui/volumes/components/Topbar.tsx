import GenericTopbar from "@/components/Topbar";
import Divider from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  VolumeFilterBy,
  useVolumes,
} from "@/contexts/Volumes/VolumesContext";
import { Filter, Search } from "lucide-react";
import { SelectIcon } from "@radix-ui/react-select";
import AddVolumeButton from "./AddVolumeButton";

function VolumesTopbar() {
  const { updateVolumes, volumesFilter, setVolumesFilter } = useVolumes();

  return (
    <GenericTopbar
      defaultHeader={{ title: "Volumes", linkTo: "/ui/volumes" }}
      refresher={updateVolumes}
      secondaryRow={
        <div className="grid grid-cols-[auto_1fr] w-full p-2 pt-1 gap-2">
          <Select
            value={volumesFilter.by}
            onValueChange={(value: VolumeFilterBy) => {
              setVolumesFilter({
                ...volumesFilter,
                by: value,
              });
            }}
          >
            <SelectTrigger className="w-max">
              <SelectIcon>
                <Filter size={16} className="mr-2" />
              </SelectIcon>
            </SelectTrigger>

            <SelectContent>
              {Object.values(VolumeFilterBy).map((value) => {
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
                  id="ownedVolumes"
                  checked={volumesFilter.myVolumes}
                  onCheckedChange={(checked) => {
                    setVolumesFilter({
                      ...volumesFilter,
                      myVolumes: checked as boolean,
                    });
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="ownedVolumes"
                  style={{ fontSize: 14, marginTop: "1px" }}
                >
                  My volumes
                </label>
              </div>
            </SelectContent>
          </Select>
          <Input
            placeholder={`Search volumes by ${volumesFilter.by}`}
            value={volumesFilter.query}
            onChange={(e) =>
              setVolumesFilter({
                ...volumesFilter,
                query: e.target.value,
              })
            }
            endIcon={<Search size={16} />}
          />
        </div>
      }
    >
      <div className="flex flex-row items-center w-full justify-end gap-2">
        <AddVolumeButton />
      </div>
    </GenericTopbar>
  );
}

export default VolumesTopbar;

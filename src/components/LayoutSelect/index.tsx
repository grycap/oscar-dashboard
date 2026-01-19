import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectIcon } from "@radix-ui/react-select";
import { LayoutGrid, LayoutList } from "lucide-react";


function LayoutSelect({ isGridView, setIsGridView }: { isGridView: boolean; setIsGridView: (val: boolean) => void }) {

  return (
    <Select
      value={isGridView ? "grid" : "list"}
      onValueChange={(val) => setIsGridView(val === "grid")}
    >
      <SelectTrigger>
        <SelectIcon> 
        {isGridView ? <LayoutGrid size={24} className="mr-2" /> : <LayoutList size={24}  className="mr-2" />}
        </SelectIcon>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grid"><div className="flex flex-row gap-2"><LayoutGrid size={24} />Grid</div></SelectItem>
        <SelectItem value="list"><div className="flex flex-row gap-2"><LayoutList size={24} />List</div></SelectItem>
      </SelectContent>
    </Select>
  );
}

export default LayoutSelect;
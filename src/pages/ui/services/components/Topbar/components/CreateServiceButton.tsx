import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OscarColors from "@/styles";
import { Plus, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function CreateServiceButton() {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          style={{
            background: OscarColors.Green4,
            outline: "none",
            border: "none",
          }}
        >
          <Plus className="mr-2 h-5 w-5" /> Create service
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Methods for service creation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              navigate("/ui/services/create");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Form</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CreateServiceButton;

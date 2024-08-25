import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Settings } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";

function AddServiceButton() {
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery({ maxWidth: 799 });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"mainGreen"}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Plus className="h-5 w-5" /> {!isSmallScreen && "Create service"}
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

export default AddServiceButton;

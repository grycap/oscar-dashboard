import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedRefreshCwProps {
  size?: number;
  className?: string;
}

function AnimatedRefreshCw({ size = 16, className }: AnimatedRefreshCwProps) {
  return (
    <RefreshCw
      size={size}
      className={cn("transition-transform duration-500 hover:rotate-180", className)}
    />
  );
}

export default AnimatedRefreshCw;

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  const { resolvedTheme } = useTheme();

  return <Sonner theme={resolvedTheme === "dark" ? "dark" : "light"} />;
};

export { Toaster };

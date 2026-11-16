import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

/** Keep all Monaco instances in sync with the dashboard's resolved appearance. */
export default function ThemedEditor(props: React.ComponentProps<typeof Editor>) {
  const { resolvedTheme } = useTheme();
  return <Editor {...props} theme={resolvedTheme === "dark" ? "vs-dark" : "light"} />;
}

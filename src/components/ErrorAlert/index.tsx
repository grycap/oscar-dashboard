import type { ComponentType } from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type ErrorAlertProps = {
  title?: string;
  description: string;
  variant?: "error" | "warning";
  icon?: ComponentType<{ className?: string }>;
};

export function ErrorAlert({ title, description, variant = "error", icon: Icon = CircleAlert }: ErrorAlertProps) {
  const isWarning = variant === "warning";

  return (
    <div className="flex items-center justify-center h-full w-full">
      <Alert
        variant={isWarning ? "default" : "destructive"}
        className={
          isWarning
            ? "max-w-md border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-950/40 dark:text-orange-300"
            : "max-w-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        }
      >
        <div className="flex flex-col items-center text-center">
          <Icon
            className={
              isWarning
                ? "h-6 w-6 mb-2 text-orange-500 dark:text-orange-400"
                : "h-6 w-6 mb-2 text-red-500 dark:text-red-400"
            }
          />
          {title && (
            <AlertTitle className={isWarning ? "text-orange-800 dark:text-orange-100" : "text-red-800 dark:text-red-100"}>
              {title}
            </AlertTitle>
          )}
          <AlertDescription className={isWarning ? "mt-1 text-sm text-orange-700 dark:text-orange-200" : "mt-1 text-sm text-red-700 dark:text-red-200"}>
            {description}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
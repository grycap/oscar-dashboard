/** Shared service/bucket visibility palette. Keep the same meaning in both lists. */
export const visibilityBadgeClasses = {
  private: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  restricted: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  public: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
} as const;

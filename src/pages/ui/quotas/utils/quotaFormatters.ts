import { bytesSizeToHumanReadable, parseMemoryToBytes } from "@/lib/utils";

export const formatCores = (millicores?: number) =>
  millicores === undefined ? "-" : (millicores / 1000).toString();

export const formatBytes = (bytes?: number) =>
  bytes === undefined ? "-" : bytesSizeToHumanReadable(bytes);

export const formatQuota = (value?: string) => value || "-";

export const usagePercentage = (used?: number, max?: number) => {
  if (used === undefined || max === undefined || max <= 0) return undefined;
  return Math.min(Math.round((used / max) * 100), 100);
};

export const usagePercentageFromQuantity = (used?: string, max?: string) => {
  if (!used || !max) return undefined;

  const parsedUsed = parseMemoryToBytes(used);
  const parsedMax = parseMemoryToBytes(max);
  if (!Number.isFinite(parsedUsed) || !Number.isFinite(parsedMax)) {
    return undefined;
  }

  return usagePercentage(parsedUsed, parsedMax);
};

export const usagePercentageFromCount = (used?: string, max?: string) => {
  if (!used || !max) return undefined;

  const parsedUsed = Number(used);
  const parsedMax = Number(max);
  if (!Number.isFinite(parsedUsed) || !Number.isFinite(parsedMax)) {
    return undefined;
  }

  return usagePercentage(parsedUsed, parsedMax);
};

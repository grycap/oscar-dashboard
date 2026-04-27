import getBucketItemsApi from "@/api/buckets/getBucketItemsApi";
import { AuthData } from "@/contexts/AuthContext";
import { SystemConfig } from "@/models/systemConfig";
import { _Object, CommonPrefix } from "@aws-sdk/client-s3";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a Kubernetes CPU string and returns the value in millicores.
 * Supported formats: "2" (cores), "1500m" (millicores)
 */
export function parseCpuToMillicores(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("m")) {
    return parseFloat(trimmed.slice(0, -1));
  }
  return parseFloat(trimmed) * 1000;
}

/**
 * Parses a Kubernetes memory string and returns the value in bytes.
 * Supported formats: "2Gi", "1174Mi", "500Ki", "1G", "1M", "1K", "1024" (bytes)
 */
export function parseMemoryToBytes(value: string): number {
  const trimmed = value.trim();
  const binarySuffixes: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
  };
  const decimalSuffixes: Record<string, number> = {
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
    P: 1000 ** 5,
  };
  for (const [suffix, multiplier] of Object.entries(binarySuffixes)) {
    if (trimmed.endsWith(suffix)) {
      return parseFloat(trimmed.slice(0, -suffix.length)) * multiplier;
    }
  }
  for (const [suffix, multiplier] of Object.entries(decimalSuffixes)) {
    if (trimmed.endsWith(suffix)) {
      return parseFloat(trimmed.slice(0, -suffix.length)) * multiplier;
    }
  }
  return parseFloat(trimmed);
}

export  function genRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, v => charset[v % charset.length]).join('');
}

export function generateReadableName(length = 6) {
  const consonants = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z"];
  const vowels = ["a", "e", "i", "o", "u"];
  let name = "";
  let useConsonant = true;

  while (name.length < length) {
    if (useConsonant) {
      name += consonants[Math.floor(Math.random() * consonants.length)];
    } else {
      name += vowels[Math.floor(Math.random() * vowels.length)];
    }
    useConsonant = !useConsonant;
  }

  return name;
}

export async function exposedServiceIsAlive(url: string, delay = 6000, attempts = -1): Promise<boolean> {
  for (let i = 0; i < attempts || attempts === -1; i++) {
    try {
      const headResponse = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        credentials: 'omit'
      });
      if (headResponse.ok) {
        return true;
      }
    } catch (error) {
      console.warn(`HEAD health check attempt ${i + 1} failed:`, error);
    }

    try {
      const getResponse = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      if (getResponse.ok) {
        return true;
      }
    } catch (error) {
      console.error(`GET health check attempt ${i + 1} failed:`, error);
    }
    await sleep(delay);
  }
  
  return false;
}

export function isVersionLower(version: string, target: string) {
  if (target === "devel") return true;
  if (version === "devel") return false;
  const v = version.split('.').map(x => parseInt(x.replace(/\D/g, '')) || 0);
  const t = target.split('.').map(x => parseInt(x.replace(/\D/g, '')) || 0);
  for (let i = 0; i < 3; i++) {
    if ((v[i] ?? 0) < (t[i] ?? 0)) return true;
    if ((v[i] ?? 0) > (t[i] ?? 0)) return false;
  }
  return false;
}

export function getUserVOs(authData: AuthData): string[] {
  const vos: string[] = [];
  if (authData.egiSession?.eduperson_entitlement) {
    authData.egiSession.eduperson_entitlement.forEach((entitlement) => {
      // "urn:mace:egi.eu:group:vo.example.eu:role=member#aai.egi.eu"
      const match = entitlement.match(/^urn:mace:egi\.eu:group:(vo\..+?):role=member(?:#|$)/);
      if (match && match[1]) {
        vos.push(match[1]);
      }
    });
  }
  if (authData.egiSession?.group_membership) {
    authData.egiSession.group_membership.forEach((group) => {
      // Split by '/' and ignore 'employees'
      group.split('/').forEach((subgroup) => {
        if (subgroup && "employees" !== subgroup) {
          vos.push(subgroup);
        }
      });
    });
  }
  if ((authData.egiSession as any).realm_access?.roles) {
    (authData.egiSession as any).realm_access.roles.forEach((role: string) => {
      // "platform-access:vo.example.eu"
      const match = role.match(/^platform-access:(vo\..+?)$/);
      if (match && match[1]) {
        vos.push(match[1]);
      }
    });
  }
  return vos;
}

export function getAllowedVOs(systemConfig: {config: SystemConfig} | null, authData: AuthData): string[] {
  if (!systemConfig || !systemConfig.config || !systemConfig.config.oidc_groups || systemConfig.config.oidc_groups.length === 0) return [];
  // If user is oscar, return all allowed VOs from system config
  if (authData.user === "oscar") return systemConfig.config.oidc_groups;
  // Get user's VOs
  const userVOs = getUserVOs(authData);
  // If user has no VOs, return all allowed VOs from system config
  if (userVOs.length === 0) return systemConfig.config.oidc_groups;
  // Filter allowed VOs based on user's VOs
  const filteredVOs = systemConfig.config.oidc_groups.filter((vo) => userVOs.includes(vo.replace('/', '')));
  return filteredVOs.length > 0 ? filteredVOs : systemConfig.config.oidc_groups;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function delay(ms: number): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, ms));
  return true;
}

export const fetchFromGitHubOptions = {
  method: 'GET',
  cache: 'no-cache' as RequestCache,
  headers: {
    'Accept': 'text/plain, application/x-yaml, */*'
  }
};

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

// Safari blocks mixed-content XHR/fetch to loopback more aggressively than Chrome.
// When the dashboard itself is already running on https://localhost, reuse that origin.
export function normalizeLoopbackAPIEndpoint(endpoint: string, currentOrigin = window.location.origin): string {
  try {
    const endpointURL = new URL(endpoint);
    const originURL = new URL(currentOrigin);

    const isLoopbackUpgrade =
      endpointURL.protocol === 'http:' &&
      originURL.protocol === 'https:' &&
      isLoopbackHostname(endpointURL.hostname) &&
      isLoopbackHostname(originURL.hostname) &&
      endpointURL.hostname === originURL.hostname &&
      (endpointURL.port === '' || endpointURL.port === '80') &&
      (originURL.port === '' || originURL.port === '443');

    if (isLoopbackUpgrade) {
      return originURL.origin;
    }
  } catch {
    return endpoint;
  }

  return endpoint;
}

export function isSafariBrowser(): boolean {
  const ua = navigator.userAgent;
  const provider = navigator.vendor;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && provider.includes("Apple");
  return isSafari;
}

export function bytesSizeToHumanReadable(size: number): string {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  const humanReadableSize = parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  return humanReadableSize;
}

export function humanReadableSizeToBytes(size: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 ** 2,
    'GB': 1024 ** 3,
    'TB': 1024 ** 4,
    'PB': 1024 ** 5,
    'EB': 1024 ** 6,
    'ZB': 1024 ** 7,
    'YB': 1024 ** 8,
  };
  const regex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB|EB|ZB|YB)$/i;
  const match = size.trim().match(regex);
  if (!match) {
    throw new Error('Invalid size format');
  }
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return Math.round(value * (units[unit] || 1));
}

export async function getCurrentBucketItems(bucketName: string, prefix: string): Promise<{folders: CommonPrefix[], items: _Object[]}> {
  const buck = await getBucketItemsApi(bucketName)
  const obj = buck.objects.filter(o => {
    if (!o.object_name.startsWith(prefix)) return false;
  
    const ch = o.object_name.replace(prefix, '').split('/');
    return (ch.length === 1 || (ch.length === 2 && ch[1] === '')) && o.object_name !== prefix;
  })
  
  const folders = obj.filter(o => o.object_name.endsWith('/'))
                      .map(folder => ({ Prefix: folder.object_name }));
  const items = obj.filter(o => !o.object_name.endsWith('/'))
                    .map(item => ({ Key: item.object_name, Size: item.size_bytes, LastModified: new Date(item.last_modified) }));
  return {folders, items};
}

export function isUserOscar(authData: { user: string }, bucket: { owner: string }): boolean {
  return (authData.user === "oscar" && (bucket.owner === authData.user || bucket.owner === ""));
}

export function shortenFullname(fullname: string): string {
  const parts = fullname.split(' ');
  parts.forEach((element, index) => {
    if (index === 0) return;
    if (element.length === 0) return;
    parts[index] = element[0] + '.';
  });
  
  return `${parts.join(' ')}`;
}

export function getHubServiceTypeTagColor(type: string) {
  switch (type.toLowerCase()) {
    case "asynchronous":
      return "bg-green-100 text-green-700";
    case "synchronous":
      return "bg-blue-100 text-blue-700";
    case "exposed":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export function isFileBase64(content: string): boolean {
  try {
    atob(content);
    return true;
  } catch (e) {
    return false;
  }
}

export function extractBase64Payload(content: string): string | null {
  const base64LinePattern =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  const normalizedLines = content
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ""))
    .filter(Boolean);

  const payloadLines: string[] = [];
  for (let i = normalizedLines.length - 1; i >= 0; i -= 1) {
    const line = normalizedLines[i];
    if (base64LinePattern.test(line)) {
      payloadLines.unshift(line);
      continue;
    }
    if (payloadLines.length > 0) {
      break;
    }
  }

  const candidate = payloadLines.join("");
  if (!candidate || candidate.length < 32 || candidate.length % 4 !== 0) {
    return null;
  }

  try {
    atob(candidate);
    return candidate;
  } catch (_error) {
    return null;
  }

}

export function decodeBase64ToBytes(content: string): Uint8Array | null {
  try {
    const decoded = atob(content);
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  } catch (_error) {
    return null;
  }
}

export function detectBinaryMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= 4) {
    if (
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
      (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)
    ) {
      return "application/zip";
    }
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return "image/gif";
    }
    if (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return "application/pdf";
    }
  }

  return "text/plain";
}

export function addItemToPosition(array: any[], item: any, position: number, countFromLast: boolean = false): any[] {
  if (countFromLast) {
    position = array.length - position;
  }
  if (position < 0) position = 0;
  if (position > array.length) position = array.length;
  const newArray = [...array];
  newArray.splice(position, 0, item);
  return newArray;
}

export interface DockerImage {
  tag: string;
  description: string;
  url: string;
}

export const convertDockerImageToMap = (images: DockerImage[]): Map<string, DockerImage> => {
  const map = new Map<string, DockerImage>();
  images.forEach(image => {
    map.set(image.tag, image);
  });
  return map;
}

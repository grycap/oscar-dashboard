import { AuthData } from "@/contexts/AuthContext";
import { SystemConfig } from "@/models/systemConfig";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        credentials: 'omit'
      });
      if (response.ok) {
        return true;
      } else if (response.status === 405) {
        const response = await fetch(url, { 
          method: 'GET',
          mode: 'cors',
          credentials: 'omit'
        });
        if (response.ok) {
          return true;
        }
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
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
  return filteredVOs;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const fetchFromGitHubOptions = {
  method: 'GET',
  cache: 'no-cache' as RequestCache,
  headers: {
    'Accept': 'text/plain, application/x-yaml, */*'
  }
};

export function isSafariBrowser(): boolean {
  const ua = navigator.userAgent;
  const provider = navigator.vendor;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && provider.includes("Apple");
  return isSafari;
}
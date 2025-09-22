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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
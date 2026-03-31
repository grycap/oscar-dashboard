import { AxiosError } from "axios";

export function errorMessage(error: any) {
  if ( error instanceof AxiosError) {
    return error.response?.data ?? error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}
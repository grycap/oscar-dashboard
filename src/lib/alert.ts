import OscarColors from "@/styles";
import React from "react";
import { toast } from "sonner";

class ToastAlert {
  constructor() {}

  private formatMessage(message: React.ReactNode | string) {
    if (typeof message === "string") {
      return React.createElement(
        "span",
        {
          className: "toast-message-scroll w-full",
        },
        message
      );
    }

    return message;
  }

  default(message: React.ReactNode | string) {
    toast(this.formatMessage(message));
  }

  success(message: string) {
    toast.success(this.formatMessage(message), {
      style: {
        backgroundColor: "#17A34B",
        color: "white",
        border: "none",
      },
    });
  }

  error(message: React.ReactNode | string) {
    if (typeof message === "string") {
      console.error(message);
    }

    toast.error(this.formatMessage(message), {
      style: {
        backgroundColor: OscarColors.Red,
        color: "white",
        border: "none",
      },
    });
  }

  warning(messsage: React.ReactNode | string) {
    if (typeof messsage === "string") {
      console.warn(messsage);
    }

    toast.warning(this.formatMessage(messsage), {
      style: {
        backgroundColor: "orange",
        color: "white",
        border: "none",
      },
    });
  }
}

export const alert = new ToastAlert();

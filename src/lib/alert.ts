import OscarColors from "@/styles";
import React from "react";
import { toast } from "sonner";

class ToastAlert {
  constructor() {}

  private formatMessage(message: React.ReactNode | string, copyable: boolean = false) {
    if (typeof message === "string") {
      return React.createElement(
        "span",
        {
          onClick: () => {
            if (!copyable) return;
            navigator.clipboard.writeText(message);
            alert.success("Alert message copied to clipboard");
          },
          title: `${copyable ? "Click to copy" : ""}`,
          className: `toast-message-scroll w-full ${copyable ? "cursor-pointer" : ""}`,
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

    toast.error(this.formatMessage(message, true), {
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

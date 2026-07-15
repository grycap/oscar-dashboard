import OscarColors from "@/styles";
import { Copy } from "lucide-react";
import React from "react";
import { toast } from "sonner";

class ToastAlert {
  constructor() {}

  private formatMessage(message: React.ReactNode ) {
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

  private handleCopy(message: string) {
    navigator.clipboard.writeText(message);
    this.success("Alert message copied to clipboard");
  }

  private copyIcon() {
    return React.createElement(
      Copy,
      {
        size: 16,
        className: "cursor-pointer",
      }
    );
  }

  default(message: React.ReactNode | string) {
    toast(this.formatMessage(message));
  }

  success(message: string) {
    toast.success("Success", {
      description: this.formatMessage(message),
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

    const copyText = typeof message === "string" ? message : "";

    toast.error("Error", {
      description: this.formatMessage(message),
      style: {
        backgroundColor: OscarColors.Red,
        color: "white",
        border: "none",
      },
      actionButtonStyle: {
        background: "transparent",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        color: "inherit",
      },
      action: {
        label: this.copyIcon(),
        onClick: () => {
          this.handleCopy(copyText);
        },
      },
    });
  }

  warning(messsage: React.ReactNode | string) {
    if (typeof messsage === "string") {
      console.warn(messsage);
    }

    toast.warning("Warning", {
      description: this.formatMessage(messsage),
      style: {
        backgroundColor: "orange",
        color: "white",
        border: "none",
      },
    });
  }
}

export const alert = new ToastAlert();

import { Copy } from "lucide-react";
import React from "react";
import { toast } from "sonner";

class ToastAlert {
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
        backgroundColor: "#15803d",
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
        backgroundColor: "#b42318",
        color: "white",
        border: "none",
      },
      actionButtonStyle: {
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

  warning(message: React.ReactNode | string) {
    if (typeof message === "string") {
      console.warn(message);
    }

    toast.warning("Warning", {
      description: this.formatMessage(message),
      style: {
        backgroundColor: "#9a4b00",
        color: "white",
        border: "none",
      },
    });
  }
}

export const alert = new ToastAlert();

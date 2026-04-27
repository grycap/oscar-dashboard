import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { exposedServiceIsAlive, isVersionLower } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { useAuth } from "@/contexts/AuthContext";


function ServiceRedirectButton({
  className,
  service,
  endpoint,
  additionalExposedPathArgs,
  authActionPathArgs,
  targetExposedPath,
  healthcheckPath = "",
}: {
  className?: string;
  service: Service;
  endpoint: string;
  additionalExposedPathArgs?: string;
  authActionPathArgs?: string;
  targetExposedPath?: string;
  healthcheckPath?: string;
}) {
  const [isAlive, setIsAlive] = useState<boolean | null>(null);
  const [redirectLink, setRedirectLink] = useState<string>("");
  const [authActionLink, setAuthActionLink] = useState<string>("");
  const { clusterInfo } = useAuth();

  const safeHealthcheckPath = healthcheckPath.startsWith("/") ? healthcheckPath.slice(1).trim() : healthcheckPath
  const healthcheckLink = `${endpoint}/system/services/${service.name}/exposed/${safeHealthcheckPath}`;
  const exposedBaseLink = `${endpoint}/system/services/${service.name}/exposed/`;
      
  /**
   * Interpolate variables in the additionalExposedPathArgs string.
   * This function replaces variables in the format {{ variableName }} with their corresponding values from the
   * service's environment variables, service properties, or short-lived JWTs.
   * Examples: env.MY_VAR, service.token, jwt.service.token
   */
  async function interpolateVariables(service: Service, additionalExposedPathArgs?: string) {
    if (!additionalExposedPathArgs) return "";

    const matches = [...additionalExposedPathArgs.matchAll(/{{\s*([^}]+)\s*}}/g)];
    let interpolatedValue = additionalExposedPathArgs;

    for (const match of matches) {
      const placeholder = match[0];
      const variableName = match[1];
      const splitVariable = variableName.split(".");
      const prefix = splitVariable[0];
      const variableKey = splitVariable[1];
      let resolvedValue = "";

      switch (prefix) {
        case "env":
          resolvedValue = service.environment.variables[variableKey] ?? "";
          break;
        case "service":
          const serviceValue = (service[variableKey as keyof Service]);
          resolvedValue = typeof serviceValue === "string" ? serviceValue : "";
          break;
        case "jwt":
          resolvedValue = await generateJwtPlaceholder(service, splitVariable);
          break;
        default:
          resolvedValue = "";
      }

      interpolatedValue = interpolatedValue.replace(placeholder, resolvedValue);
    }

    return interpolatedValue;
  }

  function resolveStringValue(service: Service, source: string, key: string) {
    if (source === "env") {
      return service.environment.variables[key] ?? "";
    }

    if (source === "service") {
      const serviceValue = service[key as keyof Service];
      return typeof serviceValue === "string" ? serviceValue : "";
    }

    return "";
  }

  async function generateJwtPlaceholder(service: Service, splitVariable: string[]) {
    const secretSource = splitVariable[1];
    const secretKey = splitVariable[2];
    const secret = resolveStringValue(service, secretSource, secretKey);

    if (!secret) {
      return "";
    }

    const token = await signJwt(
      {
        sub: service.environment.variables.FILEBROWSER_JWT_SUB ?? "user",
        groups: ["admin"],
      },
      secret,
      3600
    );

    return encodeURIComponent(token);
  }

  async function signJwt(
    payload: Record<string, unknown>,
    secret: string,
    ttlSeconds: number
  ) {
    const now = Math.floor(Date.now() / 1000);
    const encoder = new TextEncoder();
    const header = base64UrlEncode(encoder.encode(JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })));
    const body = base64UrlEncode(encoder.encode(JSON.stringify({
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
    })));
    const unsignedToken = `${header}.${body}`;
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
  }

  function base64UrlEncode(bytes: Uint8Array) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function buildExposedUrl(pathArgs?: string) {
    if (!pathArgs) {
      return exposedBaseLink;
    }

    const safePathArgs = pathArgs.startsWith("/")
      ? pathArgs.slice(1)
      : pathArgs;

    return `${exposedBaseLink}${safePathArgs}`;
  }

  function submitAuthFormAndRedirect() {
    const targetName = `oscar-filebrowser-${Date.now()}`;
    const popup = window.open("about:blank", targetName);

    if (!popup) {
      return;
    }

    popup.document.write("<!doctype html><title>Opening FileBrowser</title><p>Opening FileBrowser...</p>");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = authActionLink;
    form.target = targetName;
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    window.setTimeout(() => {
      popup.location.href = redirectLink;
    }, 800);
  }

  async function handleRedirectClick() {
    if (!authActionLink) {
      window.open(redirectLink, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const response = await fetch(authActionLink, {
        method: "POST",
        mode: "cors",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Authentication request failed with status ${response.status}`);
      }

      window.open(redirectLink, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.warn("Falling back to form-based service authentication", error);
      submitAuthFormAndRedirect();
    }
  }

  useEffect(() => {
    let isMounted = true;

    const buildRedirectLink = async () => {
      const interpolatedArgs = await interpolateVariables(
        service,
        additionalExposedPathArgs
      );
      const interpolatedAuthActionArgs = await interpolateVariables(
        service,
        authActionPathArgs
      );

      if (isMounted) {
        setRedirectLink(buildExposedUrl(targetExposedPath ?? interpolatedArgs));
        setAuthActionLink(
          interpolatedAuthActionArgs ? buildExposedUrl(interpolatedAuthActionArgs) : ""
        );
      }
    };

    const checkStatus = async () => {
      if (clusterInfo && isVersionLower(clusterInfo.version, "3.6.4")) {
        if (isMounted) setIsAlive(true);
        return;
      }
      try {
        const status = await exposedServiceIsAlive(healthcheckLink, 10000, 20);
        if (isMounted) { 
          setIsAlive(status);
        }
      } catch (error) {
        if (isMounted) {
          setIsAlive(false);
        }
      }
    };
    buildRedirectLink();
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [service, endpoint, additionalExposedPathArgs, authActionPathArgs, targetExposedPath, healthcheckPath]);

  return isAlive && redirectLink ? (
    <button
      type="button"
      className={`${className ?? ""}`}
      onClick={handleRedirectClick}
      style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
    >
      <ExternalLink />
    </button>
  ) : (
    <Loader2 className={`animate-spin ${className ?? ""}`} color={OscarColors.DarkGrayText} />
  );
}

export default ServiceRedirectButton;

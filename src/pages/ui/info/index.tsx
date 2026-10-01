import { useAuth } from "@/contexts/AuthContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import InfoItem from "./components/InfoItem";
import InfoBooleanItem from "./components/InfoBooleanItem";
import InfoListItems from "./components/InfoListItems";
import { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { useSidebar } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderPinwheel } from "lucide-react";
import env from "@/env";
import GenericTopbar from "@/components/Topbar";
import OscarColors from "@/styles";

function InfoView() {
  
  useEffect(() => {
    document.title ="OSCAR - Info"
  });
  const { authData, systemConfig, clusterInfo } = useAuth();
  const { endpoint, user, password, egiSession, token, refresh_token } = authData;
  const { providerInfo } = useMinio();
  const { open } = useSidebar();
  // 1976 is the width when flex wrap is applied with the sidebar open
  // 1824 is the width when flex wrap is applied with the sidebar closed
  const isBigScreen = useMediaQuery({maxWidth: open ? 1697 : 1824});

  const isLoading = !systemConfig || !authData.authenticated || !clusterInfo || !providerInfo || !providerInfo?.endpoint;

  function refreshPage() {
    window.location.reload();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full">
        <GenericTopbar defaultHeader={{ title: "Server information", linkTo: "/ui/info" }} refresher={refreshPage} triggerRefresherAtLoad={false} />
        <div className="flex h-full items-center justify-center px-4 py-10">
          <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <GenericTopbar defaultHeader={{ title: "Server information", linkTo: "/ui/info" }} refresher={refreshPage} triggerRefresherAtLoad={false} />
      <div className="grid grid-cols-1 gap-6 w-[95%]  py-6 mx-auto  min-w-[300px] content-start">
        <div className={"flex flex-wrap gap-5 w-full items-start" + (isBigScreen ? " justify-center": "")}>
          <Card className="w-full max-w-[700px] overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <CardTitle className="text-base font-semibold">User</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              <InfoItem label="User" value={user} enableCopy />
              {token ? (
                <>
                  <InfoItem label="Subject ID" value={egiSession?.sub ?? ""} enableCopy />
                  <InfoItem label="Access Token" value={token} isPassword enableCopy />
                  {refresh_token ? (
                    <InfoItem label="Refresh Token" value={refresh_token} isPassword enableCopy />
                  ) : egiSession?.sub?.endsWith("@egi.eu") ? (
                    <InfoItem
                      label="Refresh Token"
                      value="Get EGI Refresh Token"
                      link={{ url: env.EGI_ISSUER.replace(/\.eu.*$/, ".eu") + "/token", enableRedirectIcon: true }}
                    />
                  ) : null}
                </>
              ) : (
                <InfoItem label="Password" value={password} isPassword enableCopy />
              )}
            </div>
          </Card>

          <Card className="w-full max-w-[700px] overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <CardTitle className="text-base font-semibold">OSCAR Cluster</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              <InfoItem label="Endpoint" value={endpoint} enableCopy link={{ url: endpoint, enableRedirectIcon: true }} />
              {systemConfig.config.oidc_groups.length > 1 ? (
                <InfoListItems
                  label="Supported VOs"
                  placeholder={systemConfig.config.oidc_groups[0] + "... "}
                  values={systemConfig.config.oidc_groups}
                  enableCopy
                />
              ) : (
                <InfoItem label="Supported VOs" value={systemConfig.config.oidc_groups.toString()} enableCopy />
              )}
              <InfoItem label="Version" value={clusterInfo?.version!} enableCopy />
              <InfoItem
                label="Git commit"
                value={clusterInfo?.git_commit! + "..."}
                link={{ url: `https://github.com/grycap/oscar/commit/${clusterInfo?.git_commit!}`, enableRedirectIcon: true }}
              />
              <div className="flex flex-wrap items-center justify-evenly gap-4 px-4 py-4">
                <InfoBooleanItem label="GPU" enabled={Boolean(systemConfig?.config.gpu_available)} />
                <InfoBooleanItem label="InterLink" enabled={Boolean(systemConfig?.config.interLink_available)} />
                <InfoBooleanItem label="Yunikorn" enabled={Boolean(systemConfig?.config.yunikorn_enable)} />
              </div>
            </div>
          </Card>

          <Card className="w-full max-w-[700px] overflow-hidden border-slate-200 shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <CardTitle className="text-base font-semibold">MinIO</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              <InfoItem label="Endpoint" value={providerInfo.endpoint} enableCopy link={{ url: providerInfo.endpoint, enableRedirectIcon: true }} />
              <InfoItem label="Access key" value={providerInfo.access_key} enableCopy />
              <InfoItem label="Secret key" value={providerInfo.secret_key} isPassword enableCopy />
              <div className="flex flex-wrap items-center justify-evenly gap-4 px-4 py-4">
                <InfoBooleanItem label="SSL" enabled={Boolean(providerInfo.endpoint.includes("http://"))} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default InfoView;

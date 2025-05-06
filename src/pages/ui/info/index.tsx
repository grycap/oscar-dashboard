import { useAuth } from "@/contexts/AuthContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import OscarColors, { OscarStyles } from "@/styles";
import InfoItem from "./components/InfoItem";
import InfoBooleanItem from "./components/InfoBooleanItem";
import InfoListItems from "./components/InfoListItems";

function InfoView() {
  const { authData, systemConfig, clusterInfo } = useAuth();
  const { endpoint, user, password, egiSession, token } = authData;
  const { providerInfo } = useMinio();

  if (!systemConfig) return null;
  if (!authData.authenticated) return null;

  return (
    <div
      style={{
        width: "60vw",
        paddingTop: "40px",
        paddingLeft: "20%",
        paddingRight: "20%",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflowY: "auto",
        rowGap: "24px",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "500" }}>
        Server information
      </h1>
      <div
        style={{
          border: OscarStyles.border,
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            background: OscarColors.Gray2,
            padding: "16px",
          }}
        >
          <h1 style={{ fontSize: "16px", fontWeight: "500" }}>
            User
          </h1>
        </div>
        <InfoItem label="User" value={user} enableCopy />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        {token ? (
            <>
              <InfoItem label="EGI UID" value={egiSession?.sub! ?? egiSession?.sub!} enableCopy />
              <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
              <InfoItem
                label="Access Token"
                value={token}
                isPassword
                enableCopy
              />
            </>
          )
          :
          <>
            <InfoItem label="Password" value={password} isPassword enableCopy />
            <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
          </>
        }
      </div>
      <div
        style={{
          border: OscarStyles.border,
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            background: OscarColors.Gray2,
            padding: "16px",
          }}
        >
          <h1 style={{ fontSize: "16px", fontWeight: "500" }}>
            OSCAR Cluster
          </h1>
        </div>
        <InfoItem label="Endpoint" value={endpoint} enableCopy isLink />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        {systemConfig.config.oidc_groups.length > 1 ? 
          <InfoListItems  label="Supported VOs" placeholder={systemConfig.config.oidc_groups[0] + '... '} values={systemConfig.config.oidc_groups} enableCopy />
          :
          <InfoItem label="Supported VOs" value={systemConfig.config.oidc_groups.toString()} enableCopy />
        }
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <InfoItem label="Version" value={clusterInfo?.version!} enableCopy />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          <InfoBooleanItem
            label="GPU"
            enabled={Boolean(systemConfig?.config.gpu_available)}
          />

          <InfoBooleanItem
            label="InterLink"
            enabled={Boolean(systemConfig?.config.interLink_available)}
          />
          <InfoBooleanItem
            label="Yunikorn"
            enabled={Boolean(systemConfig?.config.yunikorn_enable)}
          />
        </div>
      </div>
      <div
        style={{
          border: OscarStyles.border,
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            background: OscarColors.Gray2,
            padding: "16px",
          }}
        >
          <h1 style={{ fontSize: "16px", fontWeight: "500" }}>
            MinIO
          </h1>
        </div>
        <InfoItem label="Endpoint" value={providerInfo.endpoint} enableCopy isLink />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <InfoItem
          label="Access key"
          value={providerInfo.access_key}
          enableCopy
        />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <InfoItem
          label="Secret key"
          value={providerInfo.secret_key}
          isPassword
          enableCopy
        />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          <InfoBooleanItem
            label="SSL"
            enabled={Boolean(providerInfo.endpoint.includes("http://"))}
          />
        </div>
      </div>
    </div>
  );
}

export default InfoView;

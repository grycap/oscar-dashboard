import { useAuth } from "@/contexts/AuthContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import OscarColors, { OscarStyles } from "@/styles";
import InfoItem from "./components/InfoItem";
import InfoBooleanItem from "./components/InfoBooleanItem";

function InfoView() {
  const { authData, systemConfig } = useAuth();
  const { endpoint, user, password } = authData;
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
            Cluster information
          </h1>
        </div>
        <InfoItem label="Endpoint" value={endpoint} enableCopy />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <InfoItem label="User" value={user} enableCopy />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        <InfoItem label="Password" value={password} isPassword enableCopy />
        <div style={{ borderTop: OscarStyles.border, margin: "0px 16px" }} />
        {authData.token && (
          <>
            <InfoItem
              label="Token"
              value={authData.token}
              isPassword
              enableCopy
            />
            <div
              style={{ borderTop: OscarStyles.border, margin: "0px 16px" }}
            />
          </>
        )}
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          <InfoBooleanItem
            label="GPU"
            enabled={Boolean(systemConfig?.gpu_avaliable)}
          />

          <InfoBooleanItem
            label="InterLink"
            enabled={Boolean(systemConfig?.interLink_available)}
          />
          <InfoBooleanItem
            label="Yunikorn"
            enabled={Boolean(systemConfig?.yunikorn_enable)}
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
            Minio information
          </h1>
        </div>
        <InfoItem label="Endpoint" value={providerInfo.endpoint} enableCopy />
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

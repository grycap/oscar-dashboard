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
        <InfoItem
          label="Password"
          value={
            "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJQVVlPaXJBM1ktZF9kR3BkajRpSkRIdzR6SGE4SVktYmhaZGFFajByamJVIn0.eyJleHAiOjE3MzMxOTk4NDEsImlhdCI6MTczMzE2NDY5NCwiYXV0aF90aW1lIjoxNzMzMTYzODQxLCJqdGkiOiI2NjVkMzk0Yi1lNDNmLTQ0M2YtOTQ3ZS1mYjc1ZGI0YmQ2NDgiLCJpc3MiOiJodHRwczovL2FhaS5lZ2kuZXUvYXV0aC9yZWFsbXMvZWdpIiwic3ViIjoiNjdlZDk3M2M2NWQ3YjhhYWM1MTYzYzQ4ODU4M2Y0NGJlODJlMjcxOTIyZGJmMGQxNGIxYmE3ZDQyZDUyMTYyMEBlZ2kuZXUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiI0M2RmZTdiMi1lMDYzLTRmZTktODQyZS03YjQwYWQ3MzZkZWIiLCJzZXNzaW9uX3N0YXRlIjoiYWI2NmM4OTktMTZlZS00MzhjLTkyNTYtZDJkM2FjYTk5NDliIiwic2NvcGUiOiJvcGVuaWQgZWR1cGVyc29uX2VudGl0bGVtZW50IHByb2ZpbGUgZW1haWwiLCJzaWQiOiJhYjY2Yzg5OS0xNmVlLTQzOGMtOTI1Ni1kMmQzYWNhOTk0OWIiLCJhdXRoZW50aWNhdGluZ19hdXRob3JpdHkiOiJodHRwczovL3d3dy5yZWRpcmlzLmVzL3Npci91cHZpZHAifQ.MGaU4KDNpwf8rRb7nTeX9SxRwAOITCeH9e1ZqqZL7YgQMXi4pvTurntPoR_fSeK0pSzjtW1lPKhI9XWbuvRMAHzCYhBtOe-_JZ6YdThOYLuBF0La5FMYp5bNB0Hqr5ywBVrkTRiuZIJuMZXWCe2yaYtrrVil0dSmiqsuLNOAe1Um2a7uZNkrN4hGm50SlpqocGA3cVE4rWbB6yw99RIAGopGoKTPiZr2SmqK_3eBTiIW4noLRL2e7lPpzPNb2dXUAwU1gU4G2J3GQMFsye8wm1d3UYcDNmROBkCHCnHbxX2THfcF2p9oTcx5FjftBVi5eN6hUAU_EGJe4GzGWQ6pFw"
          }
          isPassword
          enableCopy
        />
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

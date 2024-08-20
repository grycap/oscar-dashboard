import { useAuth } from "@/contexts/AuthContext";
import { OscarStyles } from "@/styles";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

function UserInfo() {
  const { authData } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    return () => {
      setIsHovered(false);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderLeft: OscarStyles.border,
        gap: 10,
        padding: "0 16px",
        cursor: "pointer",
      }}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      <h2
        style={{
          textDecoration: isHovered ? "underline" : "none",
        }}
      >
        {authData.user}
      </h2>
      {"-"}
      <h2
        style={{
          textDecoration: isHovered ? "underline" : "none",
        }}
      >
        {authData.endpoint}
      </h2>
      <Info />
    </div>
  );
}

export default UserInfo;

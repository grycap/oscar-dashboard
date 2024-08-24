import { useAuth } from "@/contexts/AuthContext";
import { OscarStyles } from "@/styles";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

function UserInfo() {
  const { authData } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const isSmallScreen = useMediaQuery({ maxWidth: 1099 });

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
      {!isSmallScreen && (
        <Link
          to={"/ui/info"}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <h2
            style={{
              textDecoration: isHovered ? "underline" : "none",
            }}
          >
            {authData.user}
          </h2>
          <span>{"-"}</span>
          <h2
            style={{
              textDecoration: isHovered ? "underline" : "none",
            }}
          >
            {authData.endpoint}
          </h2>
        </Link>
      )}
      <Link to={"/ui/info"}>
        <Info />
      </Link>
    </div>
  );
}

export default UserInfo;

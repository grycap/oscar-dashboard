import { OscarStyles } from "@/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Info, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Tooltip } from "../ui/tooltip";
import { alert } from "@/lib/alert";

export default function UserInfo() {
  const [isHovered, setIsHovered] = useState(false);
  const authContext = useAuth();
  const transition = { duration: 0.2, ease: "easeOut" };

  return (
    <div
      style={{
        borderLeft: OscarStyles.border,
        position: "relative",
        padding: "0 16px",
        width: "16rem",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {
          <motion.div
            key="text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{
              scale: 1.02,
              textDecoration: "underline",
            }}
            transition={transition}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              gap: 10,
              overflow: "hidden",
            }}
            onClick={() => {
              navigator.clipboard.writeText(authContext.authData.endpoint);
              alert.success("Endpoint copied to clipboard");
            }}
          >
            <span
              style={{
                textWrap: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`${authContext.authData.user} - ${authContext.authData.endpoint}`}
            </span>
            <Copy />
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}

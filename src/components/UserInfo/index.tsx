import { OscarStyles } from "@/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Info, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function UserInfo() {
  const [isHovered, setIsHovered] = useState(false);
  const authContext = useAuth();
  const transition = { duration: 0.2, ease: "easeOut" };

  function handleLogout() {
    authContext.setAuthData({
      user: "",
      password: "",
      endpoint: "",
      authenticated: false,
    });
  }

  return (
    <div
      style={{
        borderLeft: OscarStyles.border,
        position: "relative",
        padding: "0 16px",
        width: "16rem",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {!isHovered && (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transition}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>oscar - http://localhost</span>
          </motion.div>
        )}
        {isHovered && (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transition}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexGrow: 1,
              height: "100%",
              gap: "10px",
            }}
          >
            <Button variant="default" style={{ flexGrow: 1 }} asChild>
              <Link to="/ui/info">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={transition}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Info
                    style={{
                      marginRight: "0.5rem",
                      height: "1rem",
                      width: "1rem",
                    }}
                  />
                  Show info
                </motion.button>
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="icon"
              style={{ aspectRatio: "1 / 1" }}
              asChild
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={transition}
                onClick={handleLogout}
              >
                <LogOut style={{ height: "1rem", width: "1rem" }} />
                <span
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    border: 0,
                  }}
                >
                  Logout
                </span>
              </motion.button>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

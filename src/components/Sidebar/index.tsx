import OscarLogo from "@/assets/oscar-big.png";
import { Boxes, Codesandbox, Database, Info, LogOut, Notebook, Route, BarChart2, ChartPie } from "lucide-react";
import OscarColors from "@/styles";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { addItemToPosition } from "@/lib/utils";
import env from "@/env";

function AppSidebar() {
  const authContext = useAuth();
  const { open } = useSidebar();
  const location = useLocation();

  var items = [
    {
      title: "Services",
      icon: <Codesandbox size={20} />,
      path: "/services",
    },
    {
      title: "Buckets",
      icon: <Database size={20} />,
      path: "/minio",
    },
    {
      title: "Notebooks",
      icon: <Notebook size={20} />,
      path: "/notebooks",
    },
    {
      title: "Flows",
      icon: <Route size={20} />,
      path: "/flows",
    },
    {
      title: "Hub",
      icon: <Boxes size={20} />,
      path: "/hub",
    },
    {
      title: "Status",
      icon: <BarChart2  size={20} />,
      path: "/status",
    },
    {
      title: "Info",
      icon: <Info size={20} />,
      path: "/info",
    },
  ];

  // Only show quotas if the user is oscar
  if (authContext.authData.user === "oscar") {
    items = addItemToPosition(items, 
      {
        title: "Quotas",
        icon: <ChartPie size={20} />,
        path: "/quotas",
      }, 6);
  }
  
  function buildLogoutRedirectUrl(token: string): string {
    let tokenBody = JSON.parse(atob(token.split('.')[1]));
      let redurectURL = "/";
      switch (tokenBody.iss) {
        /*
          case env.EGI_ISSUER:
          redurectURL = `${env.EGI_ISSUER}${env.url_logout}?client_id=${env.EGI_client_id}&post_logout_redirect_uri=${window.location.origin}`;
          break;
        */
        case env.AI4EOSC_ISSUER:
          redurectURL = `${env.AI4EOSC_ISSUER}${env.url_logout}?client_id=${env.AI4EOSC_client_id}&post_logout_redirect_uri=${window.location.origin}`;
          break;
        case env.GRYCAP_ISSUER:
          redurectURL = `${env.GRYCAP_ISSUER}${env.url_logout}?client_id=${env.GRYCAP_client_id}&post_logout_redirect_uri=${window.location.origin}`;
          break;
        default:
          break;
      }
      return redurectURL;
  }

  function handleLogout() {
    if(authContext.authData.token) {
      window.location.href = buildLogoutRedirectUrl(authContext.authData.token);
    }
    // Clear all local and session storage before redirecting
    localStorage.removeItem("authData");
    localStorage.clear();
    sessionStorage.clear();
    // Delay redirect slightly context clean
    setTimeout(() => {
      authContext.setAuthData({
        user: "",
        password: "",
        endpoint: "",
        token: undefined,
        authenticated: false,
      });
    }, 200);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingTop: 6,
            height: "59px",
          }}
        >
          <AnimatePresence mode="popLayout">
            {open && (
              <motion.img src={OscarLogo} alt="Oscar logo" width={140} />
            )}
          </AnimatePresence>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-8">
        <SidebarGroup>
          <SidebarGroupContent>
            {items.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={"/ui" + item.path}
                      style={{
                        textDecoration: "none",
                        position: "relative",
                        fontWeight: isActive ? "bold" : undefined,
                      }}
                    >
                      {item.icon}
                      <span className="text-[16px]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Log out">
              <div
                onClick={handleLogout}
                style={{
                  height: "33px",
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <LogOut color={OscarColors.Red} />
                <span>Log out</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;

import { Outlet, Route, Routes } from "react-router-dom";
import ServicesTopbar from "./components/Topbar";
import ServicesList from "./components/ServicesList";
import { ServicesProvider } from "./context/ServicesContext";
import ServiceForm from "./components/ServiceForm";
import FDLForm from "./components/FDL";
import ServiceLogs from "./components/ServiceLogs";

function ServicesRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ServicesProvider>
            <div
              style={{
                flexGrow: 1,
                flexBasis: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ServicesTopbar />
              <FDLForm />
              <Outlet />
            </div>
          </ServicesProvider>
        }
      >
        <Route path="" element={<ServicesList />} />
        <Route path=":serviceId" element={<ServiceForm />} />
        <Route path=":serviceId/settings" element={<ServiceForm />} />
        <Route path=":serviceId/logs" element={<ServiceLogs />} />
      </Route>
    </Routes>
  );
}

export default ServicesRouter;

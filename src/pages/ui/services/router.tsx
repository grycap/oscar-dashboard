import { Outlet, Route, Routes } from "react-router-dom";
import ServicesTopbar from "./components/Topbar";
import ServicesList from "./components/ServicesList";
import { ServicesProvider } from "./context/ServicesContext";
import ServiceForm from "./components/ServiceForm";

function ServicesRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ServicesProvider>
            <ServicesTopbar />
            <Outlet />
          </ServicesProvider>
        }
      >
        <Route path="" element={<ServicesList />} />
        <Route path="create" element={<ServiceForm />} />
        <Route path=":serviceId" element={<h1>Service ID ITEM</h1>} />
      </Route>
    </Routes>
  );
}

export default ServicesRouter;

import { Outlet, Route, Routes } from "react-router-dom";
import VolumesTopbar from "./components/Topbar";
import VolumeList from "./components/VolumeList";

function VolumesRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            style={{
              flexGrow: 1,
              flexBasis: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VolumesTopbar />
            <Outlet />
          </div>
        }
      >
        <Route path="" element={<VolumeList />} />
      </Route>
    </Routes>
  );
}

export default VolumesRouter;

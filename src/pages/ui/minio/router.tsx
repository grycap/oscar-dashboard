import { Outlet, Route, Routes } from "react-router-dom";

function MinioRouter() {
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
            <Outlet />
          </div>
        }
      >
        <Route path="" element={<h1>Minio</h1>} />
        <Route path=":name" element={<h1>Minio item</h1>} />
      </Route>
    </Routes>
  );
}

export default MinioRouter;

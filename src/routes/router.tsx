import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

const AppRouter = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <h1>home</h1>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
    </>
  )
);

export default AppRouter;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import ReportesDashboard from "./pages/ReportesDashboard";
import Home from "./pages/Home";
import AdminDashboard from "./components/admin/AdminDashboard";
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reportes" element={<ReportesDashboard />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} /> {/* ✅ agrega esto */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

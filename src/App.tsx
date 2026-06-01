import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import QRScanner from "./components/QRScanner";
import Settings from "./components/Settings";
import TurfSlotManager from "./components/TurfSlotManager";

function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    if (localStorage.getItem("kicko_admin_authed") !== "true") return false;
    const profileStr = localStorage.getItem("kicko_admin_profile");
    if (!profileStr) return false;
    try {
      const profile = JSON.parse(profileStr);
      return !!(profile && profile.token);
    } catch {
      return false;
    }
  });
  return { isAuthed, setIsAuthed };
}

function LoginPage() {
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAdminAuth(); // local instance; we'll also set localStorage

  useEffect(() => {
    if (isAuthed) {
      nav("/admin", { replace: true });
    }
  }, [isAuthed, nav]);

  const handleSuccess = (admin: any) => {
    localStorage.setItem("kicko_admin_authed", "true");
    localStorage.setItem("kicko_admin_profile", JSON.stringify(admin));
    setIsAuthed(true);
    nav("/admin", { replace: true });
  };
  return <Login onAdminLoginSuccess={handleSuccess} />;
}



function AdminPage() {
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAdminAuth();

  useEffect(() => {
    if (!isAuthed) {
      nav("/login", { replace: true });
    }
  }, [isAuthed, nav]);

  const onLogout = () => {
    localStorage.removeItem("kicko_admin_authed");
    localStorage.removeItem("kicko_admin_profile");
    setIsAuthed(false);
    nav("/login", { replace: true });
  };

  if (!isAuthed) return null;
  return <AdminDashboard onLogout={onLogout} />;
}

function ScanPage() {
  const nav = useNavigate();
  const { isAuthed } = useAdminAuth();

  useEffect(() => {
    if (!isAuthed) {
      nav("/login", { replace: true });
    }
  }, [isAuthed, nav]);

  if (!isAuthed) return null;
  return <QRScanner />;
}

function SettingsPage() {
  const nav = useNavigate();
  const { isAuthed } = useAdminAuth();

  useEffect(() => {
    if (!isAuthed) {
      nav("/login", { replace: true });
    }
  }, [isAuthed, nav]);

  if (!isAuthed) return null;
  return <Settings />;
}

function TurfSlotManagerPage() {
  const nav = useNavigate();
  const { isAuthed } = useAdminAuth();

  useEffect(() => {
    if (!isAuthed) {
      nav("/login", { replace: true });
    }
  }, [isAuthed, nav]);

  if (!isAuthed) return null;
  return <TurfSlotManager />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/turf/:turfId" element={<TurfSlotManagerPage />} />
        <Route path="/admin/scan" element={<ScanPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

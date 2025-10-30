import { createContext, useState, useEffect } from "react";
import { getCurrentUser, logoutUser } from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔹 Verificar si hay usuario autenticado al cargar la app
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await getCurrentUser(); // Usa la cookie automáticamente
        setUser(res.data.usuario);
      } catch {
        setUser(null);
      }
    };
    verificarSesion();
  }, []);

  // 🔹 Iniciar sesión
  const login = (data) => {
    setUser(data.usuario);
  };

  // 🔹 Cerrar sesión
  const logout = async () => {
    await logoutUser(); // Llama al backend para borrar cookie
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

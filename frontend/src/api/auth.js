import api from "./client";

// 🔐 Iniciar sesión
export const loginUser = (data) => api.post("/auth/login", data);

// 🧍 Registrar nuevo usuario
export const registerUser = (data) => api.post("/auth/register", data);

// 🚪 Cerrar sesión (elimina la cookie en el servidor)
export const logoutUser = () => api.post("/auth/logout");

// 🔎 Verificar si hay sesión activa (usa la cookie automáticamente)
export const getCurrentUser = () => api.get("/auth/me");

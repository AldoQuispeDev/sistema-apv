import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/auth",
  withCredentials: true, // ✅ muy importante: permite enviar/recibir cookies
});

// 🔐 Iniciar sesión
export const loginUser = (data) => API.post("/login", data);

// 🧍 Registrar nuevo usuario
export const registerUser = (data) => API.post("/register", data);

// 🚪 Cerrar sesión (elimina la cookie en el servidor)
export const logoutUser = () => API.post("/logout");

// 🔎 Verificar si hay sesión activa (usa la cookie automáticamente)
export const getCurrentUser = () => API.get("/me");

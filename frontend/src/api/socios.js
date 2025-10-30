import api from "./client"; // 👈 usa el cliente global

// 🧍 Registrar un nuevo socio (con contrato)
export const crearSocio = (data) =>
  api.post("/socios", data, {
    headers: { "Content-Type": "multipart/form-data" }, // para subir archivos
  });

// 📋 Listar todos los socios
export const obtenerSocios = () => api.get("/socios");

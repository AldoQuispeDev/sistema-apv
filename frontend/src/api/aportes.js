import axios from "axios";

// 🔹 Cliente Axios configurado
const API = axios.create({
  baseURL: "https://sistema-apv-backend.onrender.com/api/aportes",
  withCredentials: true, // ✅ necesario para enviar cookies (token)
});

// 🧾 Registrar nuevo aporte (soporta cuotaId)
export const registrarAporte = async (payload) => {
  try {
    // payload puede traer: socioId, monto, observacion, fecha, cuotaId, voucher(File)
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });

    const res = await API.post("/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error al registrar aporte:", error.response?.data || error);
    throw error;
  }
};

// 🔍 Obtener aportes por DNI (igual que tenías)
export const obtenerAportesPorDNI = async (dni) => {
  try {
    const res = await API.get(`/${dni}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener aportes:", error.response?.data || error);
    throw error;
  }
};

export default { registrarAporte, obtenerAportesPorDNI };

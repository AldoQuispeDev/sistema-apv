import api from "./client";

// 🧾 Generar o actualizar un contrato
export const crearContrato = async (data) => {
  // data = { socioId, usuarioId, ciudadFirma, fechaFirma }
  const res = await api.post("/generarContratos", data); // ✅ así como pediste
  return res.data;
};

// 📄 Descargar contrato .docx
export const descargarContrato = async (socioId) => {
  const res = await api.get(`/generarContratos/descargar/${socioId}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `contrato_${socioId}.docx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};


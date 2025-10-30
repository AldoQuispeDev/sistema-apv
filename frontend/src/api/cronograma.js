import api from "./client";

// 💾 Guardar o actualizar cronograma
export const guardarCronograma = async (cuotas) => {
  return await api.post("/cronograma/guardar", cuotas);
};

// 📋 Obtener cronograma por contrato
export const obtenerCronograma = async (contratoId) => {
  const res = await api.get(`/cronograma/${contratoId}`);
  return res.data;
};

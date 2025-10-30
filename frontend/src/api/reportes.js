import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

export const getCumplimiento = (etapa, inicio, fin) =>
  api.get("/reportes/cumplimiento", { params: { etapa, inicio, fin } })
     .then(r => r.data);

export const getIngresos = (etapa, inicio, fin) =>
  api.get("/reportes/ingresos", { params: { etapa, inicio, fin } })
     .then(r => r.data);

export const getDeudaSocios = (etapa) =>
  api.get("/reportes/deuda-socios", { params: { etapa } })
     .then(r => r.data);

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // ✅ envía y recibe cookies automáticamente
});

export default api;

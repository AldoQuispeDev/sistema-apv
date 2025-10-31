import axios from "axios";

const api = axios.create({
  baseURL: "https://sistema-apv-backend.onrender.com/api",
  withCredentials: true, // ✅ envía y recibe cookies automáticamente
});

export default api;



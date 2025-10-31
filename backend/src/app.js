import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import socioRoutes from "./routes/socio.routes.js";
import aporteRoutes from "./routes/aporte.routes.js";
import contratoRoutes from "./routes/contrato.routes.js";
import cronogramaRoutes from "./routes/cronograma.routes.js";
import reporteRoutes from "./routes/reporte.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js"; // ✅ importa

dotenv.config();

const app = express();

// ✅ Configuración CORS
const allowedOrigins = [
  "http://localhost:5173", // desarrollo local
  "https://sistema-apv-a2j9.vercel.app", // tu frontend (Vercel)
  "https://sistema-apv-u9pz.vercel.app", // dominio alternativo por si cambia
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Middlewares base
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/reportes", reporteRoutes);
app.use("/api/usuarios", usuariosRoutes);

// 📂 Servir archivos subidos (contratos, modelos, imágenes, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 🔹 Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/socios", socioRoutes);
app.use("/api/aportes", aporteRoutes);
app.use("/api/generarContratos", contratoRoutes);
app.use("/api/cronograma", cronogramaRoutes);

// 🚦 Ruta de prueba (opcional)
app.get("/", (req, res) => {
  res.send("🚀 Servidor APV en funcionamiento correctamente");
});

export default app;

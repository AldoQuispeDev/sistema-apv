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
import usuariosRoutes from "./routes/usuarios.routes.js";

dotenv.config();

const app = express();

// 🔒 Render corre detrás de proxy → cookies secure necesitan esto
app.set("trust proxy", 1);

// 🌐 CORS desde variable de entorno (coma-separado)
const origins = (process.env.CLIENT_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || origins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 📦 Middlewares base
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 Archivos estáticos (contratos/vouchers/modelos)
app.use("/uploads", express.static(path.resolve("uploads")));

// 🔗 Rutas API
app.use("/api/reportes", reporteRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/socios", socioRoutes);
app.use("/api/aportes", aporteRoutes);
app.use("/api/generarContratos", contratoRoutes);
app.use("/api/cronograma", cronogramaRoutes);

// 🩺 Healthcheck
app.get("/", (_req, res) => res.send("OK"));

export default app;

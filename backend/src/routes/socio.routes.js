import { Router } from "express";
import {
  registrarSocio,
  listarSociosConAportes,
  listarSocios, // 👈 importa esta nueva función
  eliminarSocio,
  actualizarSocio,
} from "../controllers/socio.controller.js";
import { uploadContrato } from "../middlewares/upload.middleware.js";
import { verificarToken, soloJunta } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔹 Registrar socio
router.post("/", verificarToken, soloJunta, uploadContrato.single("contrato"), registrarSocio);

// 🔹 Listar socios filtrados por etapa (para Dashboard)
router.get("/", verificarToken, soloJunta, listarSocios);

// 🔹 Listar todos los socios con aportes (para reportes generales)
router.get("/con-aportes", verificarToken, soloJunta, listarSociosConAportes);

// 🔹 Actualizar socio
router.put("/:id", verificarToken, soloJunta, uploadContrato.single("contrato"), actualizarSocio);

// 🔹 Eliminar socio
router.delete("/:id", verificarToken, soloJunta, eliminarSocio);

export default router;

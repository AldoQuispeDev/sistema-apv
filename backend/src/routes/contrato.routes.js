import { Router } from "express";
import {
  generarContrato,
  registrarContrato,
  listarContratosPorSocio,
  descargarContrato,
} from "../controllers/contrato.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

/* ===========================
   🧾 RUTAS DE CONTRATOS
=========================== */

// 🟢 Generar contrato automático (crea el archivo Word y lo registra en BD)
router.post("/", verificarToken, generarContrato);

// 🟣 Registrar contrato manual (cuando se sube un contrato ya existente)
router.post("/registrar", verificarToken, registrarContrato);

// 🔵 Listar todos los contratos asociados a un socio
router.get("/socio/:socioId", verificarToken, listarContratosPorSocio);

router.get("/descargar/:socioId", verificarToken, descargarContrato);
export default router;

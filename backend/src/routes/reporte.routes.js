import { Router } from "express";
import {
  reporteCumplimiento,
  reporteIngresos,
  reporteDeudaSocios,
} from "../controllers/reporte.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas protegidas (puedes quitar verificarToken si no lo deseas)
router.get("/cumplimiento", verificarToken, reporteCumplimiento);
router.get("/ingresos", verificarToken, reporteIngresos);
router.get("/deuda-socios", verificarToken, reporteDeudaSocios);

export default router;

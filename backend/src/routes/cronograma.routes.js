import { Router } from "express";
import {
  guardarCronograma,
  obtenerCronograma,
  obtenerCronogramaPorSocio,
  crearCronogramaManual, // 🆕
} from "../controllers/cronograma.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 💾 Guardar o actualizar cronograma
router.post("/guardar", verificarToken, guardarCronograma);

// 📋 Obtener cronograma por socio (⚠️ Debe ir antes que "/:contratoId")
router.get("/socio/:socioId", verificarToken, obtenerCronogramaPorSocio);

// 📋 Obtener cronograma por contrato
router.get("/:contratoId", verificarToken, obtenerCronograma);

// 🆕 Crear cronograma manual
router.post("/manual", verificarToken, crearCronogramaManual);

export default router;

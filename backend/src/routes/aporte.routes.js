import { Router } from "express";
import {
  registrarAporte,
  listarAportesPorSocio,
} from "../controllers/aporte.controller.js";
import {
  verificarToken,
  soloJunta,
} from "../middlewares/auth.middleware.js";
import { uploadVoucher } from "../middlewares/voucher.middleware.js";

const router = Router();

// 💰 Registrar nuevo aporte (solo Junta Directiva o Admin)
router.post(
  "/",
  verificarToken,
  soloJunta,
  uploadVoucher.single("voucher"),
  registrarAporte
);

// 📋 Listar aportes por socio (autenticado y con permisos)
router.get("/:dni", verificarToken, soloJunta, listarAportesPorSocio);

export default router;

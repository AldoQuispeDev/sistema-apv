import { Router } from "express";
import { registrar, login, logout, me } from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔐 Registro de usuario (opcional si solo el admin crea usuarios)
router.post("/register", registrar);

// 🔑 Login y Logout
router.post("/login", login);
router.post("/logout", logout);

// 👤 Obtener usuario actual (requiere token)
router.get("/me", verificarToken, me);

export default router;

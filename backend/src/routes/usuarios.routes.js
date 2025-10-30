import express from "express";
import {
  listarUsuarios,
  crearUsuario,
  cambiarEstadoUsuario,
  asignarCargoDirectiva,

} from "../controllers/usuario.controller.js";

const router = express.Router();

router.get("/", listarUsuarios);
router.post("/", crearUsuario);
router.put("/estado/:id", cambiarEstadoUsuario);
router.post("/cargo", asignarCargoDirectiva); // 🆕 Nueva ruta

export default router;

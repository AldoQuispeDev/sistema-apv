import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generarToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// 🧍‍♂️ Registro de usuario
export const registrar = async (req, res) => {
  try {
    const { nombre, apellidoP, apellidoM, correo, password, rol } = req.body;

    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) return res.status(400).json({ mensaje: "Correo ya registrado" });

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellidoP,
        apellidoM,
        correo,
        password: hash,
        rol,
      },
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error("❌ Error al registrar:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
};

// 🔑 Inicio de sesión
export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // 🔍 Buscar usuario
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // ⚠️ Verificar si el usuario está activo
    if (usuario.activo === false) {
      return res.status(403).json({
        mensaje: "Tu cuenta está desactivada. Contacta con el administrador.",
      });
    }

    // 🔒 Comparar contraseñas
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });

    // 🪪 Generar token
    const token = generarToken(usuario);

    // 🍪 Guardar cookie segura
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // ⚠️ cámbialo a true si usas HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    });
  } catch (error) {
    console.error("❌ Error en el inicio de sesión:", error);
    res.status(500).json({ mensaje: "Error en el inicio de sesión" });
  }
};

// 🚪 Cerrar sesión
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  res.json({ mensaje: "Sesión cerrada correctamente" });
};

// 👤 Obtener usuario autenticado
export const me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ mensaje: "No autenticado" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ usuario });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

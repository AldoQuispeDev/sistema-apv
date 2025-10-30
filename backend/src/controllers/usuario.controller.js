import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // 👈 bcryptjs compatible con ES modules

const prisma = new PrismaClient();

// ✅ Listar todos los usuarios
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: "asc" },
      include: { cargo: true },
    });
    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error);
    res.status(500).json({ mensaje: "Error al listar usuarios" });
  }
};

// ✅ Crear nuevo usuario (con contraseña hasheada)
export const crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellidoP,
      apellidoM,
      correo,
      dni,
      domicilio,
      password,
      rol,
      cargo,
    } = req.body;

    // 🔍 Validaciones básicas
    if (!nombre || !apellidoP || !apellidoM || !correo || !password) {
      return res
        .status(400)
        .json({ mensaje: "Faltan datos obligatorios para crear el usuario." });
    }

    // 🔍 Verificar si ya existe un usuario con ese correo
    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) {
      return res
        .status(400)
        .json({ mensaje: "⚠️ Ya existe un usuario con ese correo." });
    }

    // 🔍 Verificar si ya existe con el mismo DNI (opcional)
    if (dni) {
      const existeDni = await prisma.usuario.findFirst({ where: { dni } });
      if (existeDni) {
        return res
          .status(400)
          .json({ mensaje: "⚠️ Ya existe un usuario con ese DNI." });
      }
    }

    // 🔐 Encriptar contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellidoP,
        apellidoM,
        correo,
        dni,
        domicilio,
        password: hashedPassword, // se guarda encriptada
        rol,
      },
    });

    // 🧾 Si tiene cargo directivo
    if (rol === "JUNTA_DIRECTIVA" && cargo) {
      await prisma.cargoDirectiva.create({
        data: {
          usuario: { connect: { id: usuario.id } },
          cargo,
        },
      });
    }

    res.status(201).json({
      mensaje: "✅ Usuario creado correctamente.",
      usuario,
    });
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
};

// ✅ Activar / Desactivar usuario
export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: !usuario.activo },
    });

    res.json({
      mensaje: `✅ Usuario ${
        usuarioActualizado.activo ? "activado" : "desactivado"
      } correctamente.`,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("❌ Error al cambiar estado:", error);
    res.status(500).json({ mensaje: "Error al cambiar estado del usuario" });
  }
};

// ✅ Asignar cargo directivo
export const asignarCargoDirectiva = async (req, res) => {
  try {
    const { usuarioId, cargo } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const cargoExistente = await prisma.cargoDirectiva.findUnique({
      where: { usuarioId: parseInt(usuarioId) },
    });

    let cargoAsignado;

    if (cargoExistente) {
      cargoAsignado = await prisma.cargoDirectiva.update({
        where: { usuarioId: parseInt(usuarioId) },
        data: { cargo },
      });
    } else {
      cargoAsignado = await prisma.cargoDirectiva.create({
        data: {
          usuario: { connect: { id: parseInt(usuarioId) } },
          cargo,
        },
      });
    }

    res.json({
      mensaje: "✅ Cargo asignado correctamente",
      cargoAsignado,
    });
  } catch (error) {
    console.error("❌ Error al asignar cargo:", error);
    res.status(500).json({ mensaje: "Error al asignar cargo" });
  }
};

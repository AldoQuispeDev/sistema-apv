import { PrismaClient } from "@prisma/client";
import { ContratoService } from "../services/contrato.service.js";

const prisma = new PrismaClient();

// 🧾 Generar contrato automáticamente
export const generarContrato = async (req, res) => {
  try {
    const { socioId, ciudadFirma, fechaFirma } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId)
      return res.status(401).json({ mensaje: "Usuario no autenticado" });

    if (!socioId)
      return res.status(400).json({ mensaje: "Falta el ID del socio" });

    // 📄 Llama al servicio para generar el contrato
    const resultado = await ContratoService.generarContrato({
      socioId,
      usuarioId,
      ciudadFirma,
      fechaFirma,
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error("❌ Error al generar contrato:", error);
    res.status(500).json({
      mensaje: "Error al generar contrato",
      detalle: error.message,
    });
  }
};

// 📦 Registrar contrato manual (subido o externo)
export const registrarContrato = async (req, res) => {
  try {
    const { socioId, url, ciudadFirma, fechaFirma } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId)
      return res.status(401).json({ mensaje: "Usuario no autenticado" });

    if (!socioId || !url)
      return res.status(400).json({ mensaje: "Datos incompletos" });

    // 💾 Registrar contrato
    const contrato = await ContratoService.registrarContrato({
      socioId,
      usuarioId,
      url,
      ciudadFirma,
      fechaFirma,
    });

    res.status(201).json({
      mensaje: "Contrato registrado correctamente",
      contrato,
    });
  } catch (error) {
    console.error("❌ Error al registrar contrato:", error);
    res.status(500).json({
      mensaje: "Error al registrar contrato",
      detalle: error.message,
    });
  }
};

// 📋 Listar todos los contratos de un socio
export const listarContratosPorSocio = async (req, res) => {
  try {
    const { socioId } = req.params;

    if (!socioId)
      return res.status(400).json({ mensaje: "Falta el ID del socio" });

    const contratos = await prisma.contrato.findMany({
      where: { socioId: parseInt(socioId) },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellidoP: true, apellidoM: true },
        },
        modelo: {
          select: { id: true, tipo: true, descripcion: true },
        },
      },
      orderBy: { fechaFirma: "desc" },
    });

    res.json(contratos);
  } catch (error) {
    console.error("❌ Error al listar contratos:", error);
    res.status(500).json({
      mensaje: "Error al listar contratos",
      detalle: error.message,
    });
  }
};

export const descargarContrato = async (req, res) => {
  const { socioId } = req.params;
  const contrato = await prisma.contrato.findFirst({ where: { socioId: Number(socioId) } });
  if (!contrato) return res.status(404).send("Contrato no encontrado");
  res.download(`.${contrato.rutaArchivo}`);
};

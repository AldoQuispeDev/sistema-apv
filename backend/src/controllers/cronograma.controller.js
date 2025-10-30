import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  guardarCronogramaService,
  listarCronogramaPorSocio,
} from "../services/cronograma.service.js";

/**
 * 💾 Guardar o actualizar cronograma
 */
export const guardarCronograma = async (req, res) => {
  try {
    const cuotas = req.body;
    const usuario = req.user;

    const resultado = await guardarCronogramaService(cuotas, usuario);
    res.json(resultado);
  } catch (error) {
    console.error("❌ Error al guardar cronograma:", error);
    res.status(500).json({
      mensaje: "Error al guardar cronograma",
      detalle: error.message,
    });
  }
};

/**
 * 📋 Obtener cronograma por contrato
 */
export const obtenerCronograma = async (req, res) => {
  try {
    const { contratoId } = req.params;
    const cronograma = await prisma.cronogramaPago.findMany({
      where: { contratoId: Number(contratoId) },
      orderBy: { cuotaNro: "asc" },
    });

    if (!cronograma || cronograma.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "No hay cronograma para este contrato" });
    }

    // ✅ Normalizamos fechas (evita desfase -1 día)
    const cronogramaFormateado = cronograma.map((c) => ({
      ...c,
      fechaPago: formatearFechaLocal(c.fechaPago),
    }));

    res.json(cronogramaFormateado);
  } catch (error) {
    console.error("❌ Error al obtener cronograma:", error);
    res.status(500).json({
      mensaje: "Error al obtener cronograma",
      detalle: error.message,
    });
  }
};

/**
 * 📅 Obtener cronograma por socio (con corrección de fecha)
 */
export const obtenerCronogramaPorSocio = async (req, res) => {
  try {
    const { socioId } = req.params;
    const data = await listarCronogramaPorSocio(Number(socioId));

    // ✅ Ajuste aquí — evita que React reste un día
    const dataFormateada = data.map((c) => ({
      ...c,
      fechaPago: formatearFechaLocal(c.fechaPago),
    }));

    res.json(dataFormateada);
  } catch (error) {
    console.error("❌ Error al obtener cronograma por socio:", error);
    res.status(500).json({
      mensaje: "Error al obtener cronograma por socio",
      detalle: error.message,
    });
  }
};

/**
 * 🧩 Crear cronograma manual (sin cambios)
 */
export const crearCronogramaManual = async (req, res) => {
  const tx = prisma.$transaction.bind(prisma);

  try {
    const { socioId, cuotas, contrato: contratoBody = {} } = req.body;

    if (!socioId || !Array.isArray(cuotas) || cuotas.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "Datos inválidos: socioId/cuotas" });
    }

    // Validar socio
    const socio = await prisma.socio.findUnique({
      where: { id: Number(socioId) },
      select: { id: true, etapa: true },
    });
    if (!socio) {
      return res.status(404).json({ mensaje: "Socio no encontrado" });
    }

    // 1️⃣ Upsert del modelo EXTERNO
    const modelo = await prisma.modeloContrato.upsert({
      where: { tipo: "EXTERNO" },
      update: {},
      create: {
        tipo: "EXTERNO",
        archivo: "externo",
        descripcion: "Contratos firmados externamente",
      },
    });

    // 2️⃣ Crear o reutilizar contrato EXTERNO vigente
    const etapaProyecto =
      Number(contratoBody.etapaProyecto ?? socio.etapa ?? 0);

    let contrato = await prisma.contrato.findFirst({
      where: {
        socioId: Number(socioId),
        modeloId: modelo.id,
        etapaProyecto,
        estado: { in: ["VIGENTE"] },
      },
    });

    if (!contrato) {
      contrato = await prisma.contrato.create({
        data: {
          socioId: Number(socioId),
          usuarioId: req.user?.id ?? 1,
          modeloId: modelo.id,
          etapaProyecto,
          rutaArchivo: String(contratoBody.rutaArchivo ?? "externo-manual"),
          montoLetras: contratoBody.montoLetras ?? null,
          ciudadFirma: contratoBody.ciudadFirma ?? null,
          fechaFirma: contratoBody.fechaFirma
            ? new Date(contratoBody.fechaFirma)
            : null,
          estado: contratoBody.estado ?? "VIGENTE",
        },
      });
    }

    // 3️⃣ Crear cuotas nuevas (si no existen)
    const resultados = await tx(async (prismaTx) => {
      const existentes = await prismaTx.cronogramaPago.findMany({
        where: { contratoId: contrato.id, socioId: Number(socioId) },
        select: { cuotaNro: true },
      });
      const yaCreadas = new Set(existentes.map((x) => x.cuotaNro));

      const aCrear = cuotas
        .map((c) => ({
          socioId: Number(socioId),
          contratoId: contrato.id,
          cuotaNro: Number(c.cuotaNro),
          fechaPago: new Date(c.fechaPago),
          monto: Number(c.monto),
          montoPagado: Number(c.montoPagado ?? 0),
          estado: c.estado || "PENDIENTE",
        }))
        .filter((c) => !yaCreadas.has(c.cuotaNro));

      if (aCrear.length === 0) {
        return { creados: 0, omitidos: cuotas.length };
      }

      const createMany = await prismaTx.cronogramaPago.createMany({
        data: aCrear,
      });

      return {
        creados: createMany.count,
        omitidos: cuotas.length - createMany.count,
      };
    });

    return res.status(201).json({
      mensaje: "✅ Cronograma manual creado",
      contratoId: contrato.id,
      modeloId: modelo.id,
      ...resultados,
    });
  } catch (error) {
    console.error("❌ Error al crear cronograma manual:", error);
    return res.status(500).json({
      mensaje: "Error al crear cronograma manual",
      detalle: error.message,
    });
  }
};

/**
 * 🕒 Formatea la fecha para evitar el desfase de -1 día
 */
function formatearFechaLocal(fecha) {
  const d = new Date(fecha);
  const año = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`; // formato estable (YYYY-MM-DD)
}

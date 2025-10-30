import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * 💾 Guardar o actualizar el cronograma de pagos de un socio
 * - Si el contrato existe: borra el cronograma anterior del contrato.
 * - Si no hay contrato todavía: borra por socio.
 * - Luego inserta las nuevas cuotas.
 */
export const guardarCronogramaService = async (cuotas, usuario) => {
  if (!Array.isArray(cuotas) || cuotas.length === 0) {
    throw new Error("No se recibieron cuotas válidas");
  }

  const { socioId, contratoId } = cuotas[0];
  if (!socioId) throw new Error("Falta socioId");

  // ✅ Elimina cronogramas anteriores según contrato o socio
  if (contratoId) {
    await prisma.cronogramaPago.deleteMany({ where: { contratoId } });
  } else {
    await prisma.cronogramaPago.deleteMany({ where: { socioId } });
  }

  // 💾 Inserta las cuotas nuevas
  const dataToInsert = cuotas.map((c, i) => ({
    socioId,
    contratoId: contratoId || null,
    cuotaNro: i + 1,
    monto: parseFloat(c.monto),
    fechaPago: new Date(c.fechaPago),
    estado: c.estado || "PENDIENTE",
  }));

  await prisma.cronogramaPago.createMany({ data: dataToInsert });

  // 🧠 Registrar auditoría
  await prisma.auditoria.create({
    data: {
      usuarioId: usuario?.id || 1,
      accion: "GUARDAR_CRONOGRAMA",
      descripcion: `Cronograma actualizado para socio ID ${socioId}${
        contratoId ? ` (contrato ${contratoId})` : ""
      }`,
    },
  });

  return { mensaje: "✅ Cronograma guardado correctamente" };
};

/**
 * 📋 Listar cronograma por socio, actualizando cuotas vencidas automáticamente
 */
export const listarCronogramaPorSocio = async (socioId) => {
  const hoy = new Date();

  // 🔁 Actualiza cuotas vencidas (fechaPago < hoy && estado=PENDIENTE)
  await prisma.cronogramaPago.updateMany({
    where: {
      socioId,
      estado: "PENDIENTE",
      fechaPago: { lt: hoy },
    },
    data: { estado: "ATRASADO" },
  });

  // 🔹 Retorna el cronograma actualizado
  return prisma.cronogramaPago.findMany({
    where: { socioId },
    orderBy: { cuotaNro: "asc" },
  });
};

/**
 * ✅ Marcar una cuota como pagada
 */
export const marcarCuotaPagada = async (cuotaId) => {
  return prisma.cronogramaPago.update({
    where: { id: cuotaId },
    data: { estado: "PAGADO" },
  });
};

/**
 * 🔍 Obtener cronograma por contrato (para compatibilidad con tus funciones existentes)
 */
export const obtenerCronogramaPorContrato = async (contratoId) => {
  return prisma.cronogramaPago.findMany({
    where: { contratoId },
    orderBy: { cuotaNro: "asc" },
  });
};

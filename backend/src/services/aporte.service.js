import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * 💡 Lógica automática de distribución de aportes
 * - Acepta cualquier monto
 * - Se aplica a las cuotas PENDIENTES o ATRASADAS en orden
 * - Marca las cuotas como PAGADAS cuando se completan
 * - Guarda los detalles exactos en AporteDetalle
 */
export const registrarAporteService = async ({ socioId, monto, observacion, fecha, voucher }) => {
  // 🔍 Verificar socio
  const socio = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!socio) throw new Error("Socio no encontrado");

  // 💾 Registrar aporte general
  const aporte = await prisma.aporte.create({
    data: {
      socioId,
      monto,
      observacion,
      fecha: fecha ? new Date(fecha) : new Date(),
      voucher,
    },
  });

  let saldo = monto;

  // 🔍 Buscar cuotas pendientes o atrasadas, en orden
  const cuotasPendientes = await prisma.cronogramaPago.findMany({
    where: {
      socioId,
      estado: { in: ["PENDIENTE", "ATRASADO"] },
    },
    orderBy: { cuotaNro: "asc" },
  });

  // 🧮 Distribuir el monto entre las cuotas
  for (const cuota of cuotasPendientes) {
    if (saldo <= 0) break;

    // Total ya aportado a esta cuota
    const aportesPrevios = await prisma.aporteDetalle.aggregate({
      where: { cuotaId: cuota.id },
      _sum: { monto: true },
    });
    const totalPrevio = aportesPrevios._sum.monto || 0;
    const restante = cuota.monto - totalPrevio;

    if (restante <= 0) continue; // ya está pagada

    const aplicado = saldo >= restante ? restante : saldo;

    // 💾 Registrar detalle
    await prisma.aporteDetalle.create({
      data: {
        aporteId: aporte.id,
        cuotaId: cuota.id,
        monto: aplicado,
      },
    });

    // 🔁 Actualizar saldo
    saldo -= aplicado;

    // ✅ Actualizar estado si se completó
    const nuevoTotal = totalPrevio + aplicado;
    if (nuevoTotal >= cuota.monto - 0.5) {
      await prisma.cronogramaPago.update({
        where: { id: cuota.id },
        data: { estado: "PAGADO" },
      });
    } else {
      await prisma.cronogramaPago.update({
        where: { id: cuota.id },
        data: { estado: "PENDIENTE" },
      });
    }
  }

  // 💾 Registrar auditoría
  await prisma.auditoria.create({
    data: {
      usuarioId: 1, // puedes reemplazar con req.user.id si tienes sesión activa
      accion: "REGISTRAR_APORTE",
      descripcion: `Aporte de S/ ${monto.toFixed(2)} registrado para socio ID ${socioId}`,
    },
  });

  return { mensaje: "✅ Aporte registrado correctamente", aporte };
};

/**
 * 📋 Listar aportes de un socio (por DNI)
 */
export const listarAportesPorSocioService = async (dni) => {
  return prisma.socio.findUnique({
    where: { dni },
    include: {
      aportes: {
        include: {
          detalles: { include: { cuota: true } },
        },
      },
    },
  });
};

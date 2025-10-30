import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * 💰 Registrar un nuevo aporte (actualiza estado, monto y puntualidad)
 */
export const registrarAporte = async (req, res) => {
  try {
    const { socioId, cuotaId, monto, observacion, fecha } = req.body;
    const voucher = req.file ? req.file.filename : null;

    const socioIdNum = parseInt(socioId);
    const cuotaIdNum = parseInt(cuotaId);
    const montoNum = parseFloat(monto);
    const fechaPagoReal = fecha ? new Date(fecha) : new Date();

    // 🔹 Función auxiliar: limpiar hora de fecha (solo día/mes/año)
    const limpiarFecha = (f) => {
      const d = new Date(f);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    // 0️⃣ Verificar cuota existente
    const cuota = await prisma.cronogramaPago.findUnique({
      where: { id: cuotaIdNum },
      select: {
        id: true,
        socioId: true,
        monto: true,
        montoPagado: true,
        estado: true,
        fechaPago: true,
        cuotaNro: true,
      },
    });
    if (!cuota) return res.status(404).json({ mensaje: "Cuota no encontrada" });

    // 1️⃣ Crear registro del aporte
    const aporte = await prisma.aporte.create({
      data: {
        socioId: socioIdNum,
        cuotaId: cuotaIdNum,
        monto: montoNum,
        observacion,
        fecha: fechaPagoReal,
        voucher,
      },
    });

    // 🔧 Helper: calcular total pagado en una cuota
    const getPagadoAcumulado = async (cuotaXId) => {
      const agg = await prisma.aporteDetalle.aggregate({
        where: { cuotaId: cuotaXId },
        _sum: { monto: true },
      });
      return parseFloat(agg._sum.monto || 0);
    };

    // 2️⃣ Aplicar el aporte a la cuota actual
    const pagadoAntes = await getPagadoAcumulado(cuota.id);
    const totalCuota = parseFloat(cuota.monto);
    const restante = Math.max(0, totalCuota - pagadoAntes);

    const aplicarActual = Math.min(montoNum, restante);
    let excedente = montoNum - aplicarActual;

    const tx = [];

    if (aplicarActual > 0) {
      // 💾 Registrar detalle del aporte aplicado
      tx.push(
        prisma.aporteDetalle.create({
          data: { aporteId: aporte.id, cuotaId: cuota.id, monto: aplicarActual },
        })
      );

      const nuevoPagado = pagadoAntes + aplicarActual;
      const nuevoEstado = nuevoPagado >= totalCuota ? "PAGADO" : "PENDIENTE";

      // 🧮 Calcular puntualidad (solo si se completó la cuota)
      let puntualidad = "PENDIENTE";
      if (nuevoEstado === "PAGADO") {
        puntualidad =
          limpiarFecha(fechaPagoReal) <= limpiarFecha(cuota.fechaPago)
            ? "PAGADO A TIEMPO"
            : "PAGADO CON RETRASO";
      }

      tx.push(
        prisma.cronogramaPago.update({
          where: { id: cuota.id },
          data: {
            montoPagado: nuevoPagado,
            estado: nuevoEstado,
            puntualidad,
            // ❌ No modificar fechaPago
          },
        })
      );
    }

    // 3️⃣ Distribuir excedente a siguientes cuotas pendientes
    if (excedente > 0) {
      const siguientes = await prisma.cronogramaPago.findMany({
        where: {
          socioId: socioIdNum,
          id: { not: cuota.id },
          estado: { not: "PAGADO" },
        },
        orderBy: { cuotaNro: "asc" },
        select: { id: true, monto: true, fechaPago: true },
      });

      for (const c of siguientes) {
        if (excedente <= 0) break;

        const pagadoC = await getPagadoAcumulado(c.id);
        const totalC = parseFloat(c.monto);
        const restC = Math.max(0, totalC - pagadoC);
        if (restC <= 0) continue;

        const abono = Math.min(excedente, restC);
        const nuevoPagadoC = pagadoC + abono;
        const nuevoEstadoC = nuevoPagadoC >= totalC ? "PAGADO" : "PENDIENTE";

        // 🕒 Calcular puntualidad con fecha de depósito real
        const puntualidad =
          limpiarFecha(fechaPagoReal) <= limpiarFecha(c.fechaPago)
            ? "PAGADO A TIEMPO"
            : "PAGADO CON RETRASO";

        tx.push(
          prisma.aporteDetalle.create({
            data: { aporteId: aporte.id, cuotaId: c.id, monto: abono },
          })
        );

        tx.push(
          prisma.cronogramaPago.update({
            where: { id: c.id },
            data: {
              montoPagado: nuevoPagadoC,
              estado: nuevoEstadoC,
              puntualidad,
              // ❌ No modificar fechaPago en cuotas futuras
            },
          })
        );

        excedente -= abono;
      }
    }

    // 💾 Ejecutar todas las operaciones en transacción
    if (tx.length > 0) await prisma.$transaction(tx);

    res.status(201).json({
      mensaje: "✅ Aporte registrado correctamente con puntualidad actualizada",
      aporte,
    });
  } catch (error) {
    console.error("❌ Error al registrar aporte:", error);
    res.status(500).json({ mensaje: "Error al registrar aporte" });
  }
};

/**
 * 📋 Listar aportes de un socio por su DNI
 */
export const listarAportesPorSocio = async (req, res) => {
  try {
    // ✅ Declarar variables correctamente
    const { dni } = req.params;
    const etapa = Number(req.query.etapa) || 1;

    // ✅ Buscar socio con clave compuesta dni + etapa
    const socio = await prisma.socio.findUnique({
      where: {
        dni_etapa: {
          dni: dni,
          etapa: etapa,
        },
      },
      include: {
        aportes: {
          include: {
            cuota: true,
            detalles: true,
          },
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!socio)
      return res.status(404).json({ mensaje: "Socio no encontrado" });

    res.json(socio);
  } catch (error) {
    console.error("❌ Error al obtener aportes:", error);
    res.status(500).json({ mensaje: "Error al obtener aportes" });
  }
};

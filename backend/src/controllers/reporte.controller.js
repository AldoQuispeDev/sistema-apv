import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helpers
const asDate = (v, fallback) => (v ? new Date(v) : fallback);
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

/**
 * 📈 Reporte: Cumplimiento de pagos por periodo y etapa
 */
export const reporteCumplimiento = async (req, res) => {
  try {
    const etapa = Number(req.query.etapa);
    if (!etapa) return res.status(400).json({ mensaje: "Falta parámetro 'etapa'" });

    const hoy = new Date();
    const ini = startOfDay(asDate(req.query.inicio, new Date(hoy.getFullYear(), 0, 1)));
    const fin = endOfDay(asDate(req.query.fin, new Date(hoy.getFullYear(), 11, 31)));

    const baseWhere = {
      socio: { etapa },
      fechaPago: { gte: ini, lte: fin },
    };

    const [aTiempo, conRetraso, pendientes, total] = await Promise.all([
      prisma.cronogramaPago.count({
        where: { ...baseWhere, estado: "PAGADO", puntualidad: "PAGADO A TIEMPO" },
      }),
      prisma.cronogramaPago.count({
        where: { ...baseWhere, estado: "PAGADO", puntualidad: "PAGADO CON RETRASO" },
      }),
      prisma.cronogramaPago.count({
        where: { ...baseWhere, NOT: { estado: "PAGADO" } },
      }),
      prisma.cronogramaPago.count({ where: baseWhere }),
    ]);

    const pct = (n) => (total ? ((n / total) * 100).toFixed(2) : "0.00");

    res.json([
      { puntualidad: "PAGADO A TIEMPO", cantidad: aTiempo, porcentaje: pct(aTiempo) },
      { puntualidad: "PAGADO CON RETRASO", cantidad: conRetraso, porcentaje: pct(conRetraso) },
      { puntualidad: "PENDIENTE", cantidad: pendientes, porcentaje: pct(pendientes) },
    ]);
  } catch (error) {
    console.error("❌ Cumplimiento:", error);
    res.status(500).json({ mensaje: "Error al generar reporte" });
  }
};

/**
 * 💰 Reporte: Ingresos proyectados vs recaudados por etapa y periodo
 */
export const reporteIngresos = async (req, res) => {
  try {
    const etapa = Number(req.query.etapa);
    if (!etapa) return res.status(400).json({ mensaje: "Falta parámetro 'etapa'" });

    const hoy = new Date();
    const ini = startOfDay(asDate(req.query.inicio, new Date(hoy.getFullYear(), 0, 1)));
    const fin = endOfDay(asDate(req.query.fin, new Date(hoy.getFullYear(), 11, 31)));

    const [{ _sum: sumProj }, { _sum: sumRec }] = await Promise.all([
      prisma.cronogramaPago.aggregate({
        _sum: { monto: true },
        where: { socio: { etapa }, fechaPago: { gte: ini, lte: fin } },
      }),
      prisma.aporte.aggregate({
        _sum: { monto: true },
        where: { socio: { etapa }, fecha: { gte: ini, lte: fin } },
      }),
    ]);

    const proyectado = Number(sumProj.monto || 0);
    const recaudado  = Number(sumRec.monto || 0);
    const diferencia = recaudado - proyectado;
    const porcentaje = proyectado ? ((recaudado / proyectado) * 100).toFixed(2) : "0.00";

    res.json({ etapa, proyectado, recaudado, diferencia, porcentaje });
  } catch (error) {
    console.error("❌ Ingresos:", error);
    res.status(500).json({ mensaje: "Error al generar reporte" });
  }
};

/**
 * 🧾 Reporte: Deuda total por socio (por etapa)
 * - total  = sum(cronograma.monto)
 * - pagado = sum(cronograma.montoPagado)
 * - deuda  = total - pagado
 * - cuotasAtrasadas = count(estado='ATRASADO')
 */
export const reporteDeudaSocios = async (req, res) => {
  try {
    const etapa = Number(req.query.etapa);
    if (!etapa) return res.status(400).json({ mensaje: "Falta parámetro 'etapa'" });

    const socios = await prisma.socio.findMany({
      where: { etapa },
      select: {
        id: true,
        dni: true,
        nombres: true,
        apellidoP: true,
        apellidoM: true,
        etapa: true,
        manzana: true,
        numLote: true,
        cronogramas: {
          select: { monto: true, montoPagado: true, estado: true },
        },
      },
    });

    const resultado = socios.map((s) => {
      const total = s.cronogramas.reduce((acc, c) => acc + Number(c.monto || 0), 0);
      const pagado = s.cronogramas.reduce((acc, c) => acc + Number(c.montoPagado || 0), 0);
      const deuda = total - pagado;
      const cuotasAtrasadas = s.cronogramas.filter((c) => c.estado === "ATRASADO").length;
      const cumplimiento = total ? Number(((pagado / total) * 100).toFixed(2)) : 0;

      return {
        socioId: s.id,
        dni: s.dni,
        socio: `${s.nombres} ${s.apellidoP} ${s.apellidoM}`,
        etapa: s.etapa,
        manzana: s.manzana || "-",
        lote: s.numLote || "-",
        total,
        pagado,
        deuda,
        cuotasAtrasadas,
        cumplimiento,
      };
    });

    res.json(resultado.sort((a, b) => b.deuda - a.deuda));
  } catch (error) {
    console.error("❌ Deuda por socio:", error);
    res.status(500).json({ mensaje: "Error al generar reporte" });
  }
};

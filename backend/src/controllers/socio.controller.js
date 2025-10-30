import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ============================================================
   ✅ Registrar nuevo socio
============================================================ */
export const registrarSocio = async (req, res) => {
  try {
    const {
      dni,
      nombres,
      apellidoP,
      apellidoM,
      telefono,
      domicilio,
      etapa,
      manzana,
      numLote,
      areaLote,
      nombrePariente,
      apellidosPariente,
      montoTotal,
    } = req.body;

    const contrato = req.file ? req.file.filename : null;

    // 🧩 Verificar si ya existe socio con el mismo DNI en la misma etapa
    const socioExistente = await prisma.socio.findFirst({
      where: { dni, etapa: parseInt(etapa) },
    });

    if (socioExistente) {
      return res.status(400).json({
        mensaje:
          "⚠️ Ya existe un socio con este DNI en la misma etapa. Puede registrarse en otra etapa.",
      });
    }

    // ✅ Crear nuevo socio
    const socio = await prisma.socio.create({
      data: {
        dni,
        nombres,
        apellidoP,
        apellidoM,
        telefono,
        domicilio,
        etapa: parseInt(etapa),
        manzana,
        numLote,
        areaLote: areaLote ? parseFloat(areaLote) : null,
        nombrePariente,
        apellidosPariente,
        montoTotal: parseFloat(montoTotal),
        contrato,
      },
    });

    res.status(201).json({
      mensaje: "✅ Socio registrado correctamente",
      socio,
    });
  } catch (error) {
    console.error("❌ Error al registrar socio:", error);
    res.status(500).json({
      mensaje: "Error al registrar socio",
      error: error.message,
    });
  }
};

/* ============================================================
   ✅ Listar todos los socios con cálculo de aportes y saldo
============================================================ */
export const listarSociosConAportes = async (req, res) => {
  try {
    const socios = await prisma.socio.findMany({
      include: { aportes: true },
      orderBy: { id: "desc" },
    });

    const resultado = socios.map((s) => {
      const totalAportado = s.aportes.reduce((sum, a) => sum + a.monto, 0);
      const saldo = (s.montoTotal || 0) - totalAportado;

      return {
        id: s.id,
        dni: s.dni,
        nombres: s.nombres,
        apellidoP: s.apellidoP,
        apellidoM: s.apellidoM,
        telefono: s.telefono,
        domicilio: s.domicilio,
        etapa: s.etapa,
        manzana: s.manzana,
        numLote: s.numLote,
        areaLote: s.areaLote,
        montoTotal: s.montoTotal,
        totalAportado,
        saldo,
        contrato: s.contrato,
        nombrePariente: s.nombrePariente,
        apellidosPariente: s.apellidosPariente,
        creadoEn: s.creadoEn,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("❌ Error al listar socios:", error);
    res.status(500).json({
      mensaje: "Error al listar socios",
      error: error.message,
    });
  }
};

/* ============================================================
   ✅ Obtener socio por ID (para edición o detalle)
============================================================ */
export const obtenerSocioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const socio = await prisma.socio.findUnique({
      where: { id: parseInt(id) },
      include: { aportes: true, contratos: true },
    });

    if (!socio) {
      return res.status(404).json({ mensaje: "Socio no encontrado" });
    }

    res.json(socio);
  } catch (error) {
    console.error("❌ Error al obtener socio:", error);
    res.status(500).json({ mensaje: "Error al obtener socio" });
  }
};

/* ============================================================
   🗑️ Eliminar socio (con limpieza de relaciones)
============================================================ */
export const eliminarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const socioId = parseInt(id);

    // 🧩 Verificar si el socio existe
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado" });
    }

    // 🔹 Eliminar registros dependientes primero
    await prisma.cronogramaPago.deleteMany({ where: { socioId } });
    await prisma.contrato.deleteMany({ where: { socioId } });
    await prisma.aporte.deleteMany({ where: { socioId } }).catch(() => {});

    // 🔥 Eliminar el socio
    await prisma.socio.delete({
      where: { id: socioId },
    });

    res.json({ mensaje: "✅ Socio eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar socio:", error);
    res.status(500).json({ error: "Error al eliminar socio" });
  }
};

/* ============================================================
   ✅ Actualizar socio sin perder contrato anterior
============================================================ */
export const actualizarSocio = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      dni,
      nombres,
      apellidoP,
      apellidoM,
      telefono,
      domicilio,
      etapa,
      manzana,
      numLote,
      areaLote,
      nombrePariente,
      apellidosPariente,
      montoTotal,
    } = req.body;

    const socioExistente = await prisma.socio.findUnique({ where: { id } });

    const contrato = req.file
      ? req.file.filename
      : socioExistente?.contrato || null;

    const socio = await prisma.socio.update({
      where: { id },
      data: {
        dni,
        nombres,
        apellidoP,
        apellidoM,
        telefono,
        domicilio,
        etapa: parseInt(etapa),
        manzana,
        numLote,
        areaLote: areaLote ? parseFloat(areaLote) : null,
        nombrePariente,
        apellidosPariente,
        montoTotal: parseFloat(montoTotal),
        contrato,
      },
    });

    res.json({ mensaje: "✅ Socio actualizado correctamente", socio });
  } catch (error) {
    console.error("❌ Error al actualizar socio:", error);
    res.status(500).json({
      mensaje: "Error al actualizar socio",
      error: error.message,
    });
  }
};

/* ============================================================
   ✅ Listar socios filtrando por etapa (para Dashboard)
============================================================ */
export const listarSocios = async (req, res) => {
  try {
    const etapa = Number(req.query.etapa) || 1;

    const socios = await prisma.socio.findMany({
      where: { etapa },
      include: {
        contratos: true,
        aportes: true,
        cronogramas: true,
      },
      orderBy: { id: "asc" },
    });

    if (socios.length === 0) {
      return res
        .status(404)
        .json({ mensaje: `No hay socios registrados en la etapa ${etapa}` });
    }

    res.json(socios);
  } catch (error) {
    console.error("❌ Error al listar socios:", error);
    res.status(500).json({
      mensaje: "Error al obtener socios",
      error: error.message,
    });
  }
};

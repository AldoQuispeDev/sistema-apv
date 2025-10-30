import { PrismaClient } from "@prisma/client";
import { generarDocumentoWord } from "../utils/docxGenerator.js";
import numeroALetras from "numero-a-letras";

const prisma = new PrismaClient();

// 🔤 Convierte número a letras
const convertirNumeroALetras = (num) => {
  try {
    if (typeof numeroALetras.NumeroALetras === "function") {
      return numeroALetras.NumeroALetras(num);
    }
    if (typeof numeroALetras === "function") {
      return numeroALetras(num);
    }
    return num.toString();
  } catch (error) {
    console.error("⚠️ Error al convertir número a letras:", error);
    return num.toString();
  }
};

export const ContratoService = {
  // 🧾 GENERAR O ACTUALIZAR CONTRATO AUTOMÁTICO (por socio y etapa)
  async generarContrato({ socioId, usuarioId, ciudadFirma, fechaFirma }) {
    // 📋 Validaciones básicas
    const socio = await prisma.socio.findUnique({ where: { id: socioId } });
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    const cargo = await prisma.cargoDirectiva.findUnique({ where: { usuarioId } });

    if (!socio) throw new Error("Socio no encontrado");
    if (!usuario) throw new Error("Usuario no encontrado");
    if (!cargo) throw new Error("El usuario no tiene cargo asignado en la directiva");

    // 🔍 Buscar plantilla de contrato según el cargo (Presidente, Tesorero, etc.)
    const modelo = await prisma.modeloContrato.findFirst({
      where: { tipo: cargo.cargo },
    });
    if (!modelo) throw new Error("No existe modelo de contrato para este cargo");

    // 💰 Convertir monto total a letras
    const montoLetras = convertirNumeroALetras(socio.montoTotal || 0)
      .toUpperCase()
      .replace("PESOS", "SOLES");

    // 🔎 Obtener cronograma actualizado desde la base de datos
    const cuotas = await prisma.cronogramaPago.findMany({
      where: { socioId: socio.id },
      orderBy: { cuotaNro: "asc" },
    });

    // 🧮 Convertimos el cronograma para el Word
    const cronograma = cuotas.map((c) => ({
      dni: socio.dni,
      nombre: `${socio.nombres} ${socio.apellidoP} ${socio.apellidoM}`,
      fechaPago: new Date(c.fechaPago).toLocaleDateString("es-PE"),
      monto: parseFloat(c.monto).toFixed(2),
    }));

    // 📊 Datos de resumen del cronograma
    const totalCuotas = cuotas.reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);
    const cuotaInicial = cuotas[0]?.monto?.toFixed(2) || "0.00";
    const fechaInicial = cuotas[0]?.fechaPago
      ? new Date(cuotas[0].fechaPago).toLocaleDateString("es-PE")
      : "—";
    const saldoPendiente = (socio.montoTotal - totalCuotas).toFixed(2);

    // 🧾 Generar documento Word antes del upsert
    const rutaArchivo = generarDocumentoWord(modelo.archivo, {
      // 🏠 Datos del APV y directivo
      NOMBRE_APV: "ASOCIACIÓN PRO VIVIENDA SEÑOR DE HUANCA",
      FECHA_ACTUAL: new Date().toLocaleDateString("es-PE"),
      NOMBRE_DIRECTIVO: usuario.nombre,
      APELLIDOP_DIRECTIVO: usuario.apellidoP,
      APELLIDOM_DIRECTIVO: usuario.apellidoM,
      DNI_DIRECTIVO: usuario.dni || "00000000",
      DOMICILIO_DIRECTIVO: usuario.domicilio || "Cusco",
      CARGO_DIRECTIVO: cargo.cargo,

      // 👥 Datos del socio
      NOMBRES_SOCIO: socio.nombres,
      APELLIDOP_SOCIO: socio.apellidoP,
      APELLIDOM_SOCIO: socio.apellidoM,
      DNI_SOCIO: socio.dni,
      DOMICILIO_SOCIO: socio.domicilio || "Cusco",
      MANZANA: socio.manzana || "—",
      LOTE: socio.numLote || "—",
      AREA: socio.areaLote ? `${socio.areaLote} m²` : "—",

      // 💰 Datos financieros
      MONTO_TOTAL: socio.montoTotal?.toFixed(2),
      MONTO_LETRAS: montoLetras,
      CUOTA_INICIAL: cuotaInicial,
      FECHA_CUOTA_INICIAL: fechaInicial,
      SALDO_PENDIENTE: saldoPendiente,
      INTERES_MORATORIO: "5",

      // ✍️ Firmas y ubicación
      CIUDAD_FIRMA: ciudadFirma || "Canas",
      FECHA_FIRMA: fechaFirma
        ? new Date(fechaFirma).toLocaleDateString("es-PE")
        : new Date().toLocaleDateString("es-PE"),
      FIRMA_DIRECTIVO: `${usuario.nombre} ${usuario.apellidoP}`,
      FIRMA_SOCIO: `${socio.nombres} ${socio.apellidoP}`,

      // 🧮 Cronograma dinámico (para tabla en Word)
      cronograma,
    });

    // ⚙️ Crear o actualizar contrato (por socio y etapa)
    const contrato = await prisma.contrato.upsert({
      where: {
        socioId_etapaProyecto: {
          socioId: socio.id,
          etapaProyecto: socio.etapa,
        },
      },
      update: {
        usuarioId: usuario.id,
        modeloId: modelo.id,
        rutaArchivo,
        montoLetras,
        ciudadFirma: ciudadFirma || "Canas",
        fechaFirma: fechaFirma ? new Date(fechaFirma) : new Date(),
      },
      create: {
        socioId: socio.id,
        usuarioId: usuario.id,
        modeloId: modelo.id,
        etapaProyecto: socio.etapa,
        rutaArchivo,
        montoLetras,
        ciudadFirma: ciudadFirma || "Canas",
        fechaFirma: fechaFirma ? new Date(fechaFirma) : new Date(),
      },
    });

    // 🧠 Auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: usuario.id,
        accion: "UPSERT_CONTRATO",
        descripcion: `Contrato generado o actualizado para socio ${socio.nombres} (${socio.dni}) en etapa ${socio.etapa}`,
      },
    });

    // ✅ Respuesta final
    return {
      mensaje: "✅ Contrato guardado correctamente (por socio y etapa)",
      url: `http://localhost:4000${rutaArchivo}`,
      contrato,
    };
  },
};

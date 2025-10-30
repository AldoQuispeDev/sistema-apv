import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// 📘 Genera un documento Word a partir de una plantilla y datos dinámicos
export function generarDocumentoWord(nombreArchivoPlantilla, datos) {
  try {
    // 📂 Ruta de la plantilla base
    const rutaModelo = path.join(process.cwd(), "uploads", "modelos", nombreArchivoPlantilla);
    if (!fs.existsSync(rutaModelo)) {
      throw new Error(`No se encontró la plantilla Word: ${rutaModelo}`);
    }

    // 📦 Cargar el archivo .docx
    const contenido = fs.readFileSync(rutaModelo, "binary");
    const zip = new PizZip(contenido);

    // 🧩 Configurar Docxtemplater con delimitadores { }
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
    });

    // 🧾 Reemplazar los placeholders del Word
    doc.render({
      // 🏠 Datos del directivo
      NOMBRE_APV: datos.NOMBRE_APV,
      FECHA_ACTUAL: datos.FECHA_ACTUAL,
      NOMBRE_DIRECTIVO: datos.NOMBRE_DIRECTIVO,
      APELLIDOP_DIRECTIVO: datos.APELLIDOP_DIRECTIVO,
      APELLIDOM_DIRECTIVO: datos.APELLIDOM_DIRECTIVO,
      DNI_DIRECTIVO: datos.DNI_DIRECTIVO,
      DOMICILIO_DIRECTIVO: datos.DOMICILIO_DIRECTIVO,
      CARGO_DIRECTIVO: datos.CARGO_DIRECTIVO,

      // 👥 Datos del socio
      NOMBRES_SOCIO: datos.NOMBRES_SOCIO,
      APELLIDOP_SOCIO: datos.APELLIDOP_SOCIO,
      APELLIDOM_SOCIO: datos.APELLIDOM_SOCIO,
      DNI_SOCIO: datos.DNI_SOCIO,
      DOMICILIO_SOCIO: datos.DOMICILIO_SOCIO,
      MANZANA: datos.MANZANA,
      LOTE: datos.LOTE,
      AREA: datos.AREA,

      // 💰 Datos financieros
      MONTO_TOTAL: datos.MONTO_TOTAL,
      MONTO_LETRAS: datos.MONTO_LETRAS,
      CUOTA_INICIAL: datos.CUOTA_INICIAL || "0.00",
      FECHA_CUOTA_INICIAL: datos.FECHA_CUOTA_INICIAL || "—",
      SALDO_PENDIENTE: datos.SALDO_PENDIENTE || "0.00",
      INTERES_MORATORIO: datos.INTERES_MORATORIO || "0",

      // 🧮 Tabla dinámica del cronograma
      cronograma: datos.cronograma || [], // ✅ Aquí Docxtemplater generará las filas

      // 📍 Firma y ubicación
      CIUDAD_FIRMA: datos.CIUDAD_FIRMA,
      FECHA_FIRMA: datos.FECHA_FIRMA,

      // ✍️ Firmas
      FIRMA_DIRECTIVO: datos.FIRMA_DIRECTIVO,
      FIRMA_SOCIO: datos.FIRMA_SOCIO,
    });

    // 💾 Guardar el archivo generado
    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    const carpetaDestino = path.join(process.cwd(), "uploads", "contratos");
    if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

    const nombreArchivoSalida = `contrato_${datos.DNI_SOCIO}_${Date.now()}.docx`;
    const rutaSalida = path.join(carpetaDestino, nombreArchivoSalida);

    fs.writeFileSync(rutaSalida, buffer);
    console.log(`✅ Contrato generado correctamente: ${rutaSalida}`);

    // Retornar ruta pública para descarga
    return `/uploads/contratos/${nombreArchivoSalida}`;
  } catch (error) {
    console.error("❌ Error al generar documento Word:", error.message);
    throw new Error(`Error generando documento Word: ${error.message}`);
  }
}

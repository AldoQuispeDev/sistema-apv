import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando carga inicial...");

  // 🔐 Encriptar contraseñas
  const adminPass = await bcrypt.hash("admin123", 10);
  const juntaPass = await bcrypt.hash("junta123", 10);

  // 👤 Usuario ADMIN
  await prisma.usuario.upsert({
    where: { correo: "admin@gmail.com" },
    update: {},
    create: {
      nombre: "Admin",
      apellidoP: "Principal",
      apellidoM: "Sistema",
      correo: "admin@gmail.com",
      password: adminPass,
      rol: "ADMIN",
      activo: true,
    },
  });

  // 👤 Usuario JUNTA_DIRECTIVA (ejemplo: Presidente)
  const junta = await prisma.usuario.upsert({
    where: { correo: "presidente@gmail.com" },
    update: {},
    create: {
      nombre: "Juan",
      apellidoP: "Huamán",
      apellidoM: "Condori",
      correo: "presidente@gmail.com",
      password: juntaPass,
      rol: "JUNTA_DIRECTIVA",
      activo: true,
      dni: "71234567",
      domicilio: "Cusco",
    },
  });

  // 🧾 Crear cargo para la junta
  await prisma.cargoDirectiva.upsert({
    where: { usuarioId: junta.id },
    update: {},
    create: {
      usuarioId: junta.id,
      cargo: "PRESIDENTE",
    },
  });

  // 🧾 Crear modelos de contrato
  const modelos = [
    { tipo: "PRESIDENTE", archivo: "presidente.docx", descripcion: "Modelo contrato presidente" },
    { tipo: "SECRETARIO", archivo: "secretario.docx", descripcion: "Modelo contrato secretario" },
    { tipo: "TESORERO", archivo: "tesorero.docx", descripcion: "Modelo contrato tesorero" },
    ];

  for (const modelo of modelos) {
    await prisma.modeloContrato.upsert({
      where: { tipo: modelo.tipo },
      update: {},
      create: modelo,
    });
  }

  console.log("✅ Seed ejecutado correctamente.");
}

main()
  .catch((err) => {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

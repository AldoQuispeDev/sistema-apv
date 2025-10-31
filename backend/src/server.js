import app from "./app.js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ✅ Probar conexión con la base de datos Railway
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Conectado correctamente a Railway");
  } catch (error) {
    console.error("❌ Error al conectar a Railway:", error);
    process.exit(1);
  }
})();

// 🚀 Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor APV en funcionamiento correctamente en el puerto ${PORT}`);
});

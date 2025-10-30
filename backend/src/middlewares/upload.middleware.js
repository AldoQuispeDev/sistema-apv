import multer from "multer";
import path from "path";
import fs from "fs";

// 📁 Carpeta destino
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/contratos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadContrato = multer({ storage });

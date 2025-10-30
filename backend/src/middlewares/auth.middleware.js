import jwt from "jsonwebtoken";

// ✅ Verificar que el token sea válido
export const verificarToken = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      console.warn("⚠️ No se encontró el token en las cookies");
      return res.status(401).json({ mensaje: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guarda los datos del usuario en la request
    console.log("✅ Token verificado para:", decoded.correo);

    next();
  } catch (error) {
    console.error("❌ Token inválido o expirado:", error.message);
    return res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
};

// ✅ Solo administradores
export const soloAdmin = (req, res, next) => {
  if (req.user.rol !== "ADMIN") {
    console.warn("🚫 Acceso denegado: solo ADMIN");
    return res
      .status(403)
      .json({ mensaje: "Solo administradores pueden acceder" });
  }
  next();
};

// ✅ Solo Junta Directiva o Administradores
export const soloJunta = (req, res, next) => {
  if (!["ADMIN", "JUNTA_DIRECTIVA"].includes(req.user.rol)) {
    console.warn("🚫 Acceso denegado: solo Junta Directiva o Admin");
    return res.status(403).json({
      mensaje: "Solo la Junta Directiva o Administradores pueden acceder",
    });
  }
  next();
};

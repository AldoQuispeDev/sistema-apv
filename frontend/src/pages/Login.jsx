import { useState, useContext } from "react";
import { loginUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ correo, password });
      const usuario = res.data.usuario || res.data;

      if (!usuario.activo) {
        setMensaje("🚫 Tu cuenta está desactivada. Contacta con el administrador.");
        return;
      }

      login(usuario);

      // ✅ Redirección según el rol
      if (usuario.rol === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      setMensaje(
        error.response?.data?.mensaje ||
          "Error al iniciar sesión. Verifica tus credenciales."
      );
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h3 className="text-center mb-4">Iniciar Sesión 🔑</h3>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-3"
          placeholder="Correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <input
          className="form-control mb-3"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary w-100">Entrar</button>
      </form>

      {mensaje && <p className="text-danger text-center mt-3">{mensaje}</p>}
    </div>
  );
}

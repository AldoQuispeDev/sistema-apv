import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    apellidoP: "",
    apellidoM: "",
    correo: "",
    password: "",
    rol: "JUNTA_DIRECTIVA",
  });
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      navigate("/"); // Redirige a login tras registro
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || "Error al registrar usuario");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "450px" }}>
      <h3 className="text-center mb-4">Registro de Usuario 🧾</h3>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" name="nombre" placeholder="Nombre" onChange={handleChange} required />
        <input className="form-control mb-2" name="apellidoP" placeholder="Apellido Paterno" onChange={handleChange} required />
        <input className="form-control mb-2" name="apellidoM" placeholder="Apellido Materno" onChange={handleChange} required />
        <input className="form-control mb-2" type="email" name="correo" placeholder="Correo" onChange={handleChange} required />
        <input className="form-control mb-2" type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
        <select className="form-control mb-3" name="rol" onChange={handleChange}>
          <option value="JUNTA_DIRECTIVA">Junta Directiva</option>
          <option value="ADMIN">Administrador</option>
        </select>
        <button className="btn btn-success w-100">Registrar</button>
      </form>
      {mensaje && <p className="text-danger text-center mt-3">{mensaje}</p>}
      <p className="text-center mt-3">
        ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
      </p>
    </div>
  );
}

import { useState, useEffect, useContext } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function SocioModal({ show, onHide, refrescar, socioEditar }) {
  const { user } = useContext(AuthContext);

  const [errores, setErrores] = useState({});

  const [socio, setSocio] = useState({
    dni: "",
    nombres: "",
    apellidoP: "",
    apellidoM: "",
    telefono: "",
    domicilio: "",
    etapa: 1,
    numLote: "",
    manzana: "",
    areaLote: "",
    nombrePariente: "",
    apellidosPariente: "",
    montoTotal: "",
    contrato: null,
  });

  useEffect(() => {
    if (socioEditar) {
      setSocio({
        ...socioEditar,
        contrato: socioEditar.contrato || null,
        nombrePariente:
          socioEditar.nombrePariente || socioEditar.nombre_pariente || "",
        apellidosPariente:
          socioEditar.apellidosPariente ||
          socioEditar.apellidos_pariente ||
          "",
      });
    } else {
      setSocio({
        dni: "",
        nombres: "",
        apellidoP: "",
        apellidoM: "",
        telefono: "",
        domicilio: "",
        etapa: 1,
        numLote: "",
        manzana: "",
        areaLote: "",
        nombrePariente: "",
        apellidosPariente: "",
        montoTotal: "",
        contrato: null,
      });
    }
  }, [socioEditar]);

  // 📋 Validaciones en tiempo real
  const validarCampo = (name, value) => {
    let mensaje = "";

    switch (name) {
      case "dni":
        if (!/^\d{8}$/.test(value)) mensaje = "El DNI debe tener 8 dígitos numéricos.";
        break;
      case "telefono":
        if (!/^\d{9}$/.test(value))
          mensaje = "El número de teléfono debe tener 9 dígitos numéricos.";
        break;
      case "nombres":
      case "apellidoP":
      case "apellidoM":
        if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(value))
          mensaje = "Solo se permiten letras y espacios.";
        break;
      case "numLote":
        if (value && !/^\d+$/.test(value)) mensaje = "Solo se permiten números.";
        break;
      case "areaLote":
      case "montoTotal":
        if (value <= 0) mensaje = "Debe ser un valor mayor a 0.";
        break;
      default:
        break;
    }

    setErrores((prev) => ({ ...prev, [name]: mensaje }));
    return mensaje === "";
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const val = files ? files[0] : value;

    validarCampo(name, val);
    setSocio({ ...socio, [name]: val });
  };

  // 💾 Guardar socio
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar todos los campos críticos
    const camposValidos = [
      "dni",
      "nombres",
      "apellidoP",
      "apellidoM",
      "telefono",
      "montoTotal",
    ];

    const esValido = camposValidos.every((campo) =>
      validarCampo(campo, socio[campo])
    );

    if (!esValido) {
      alert("⚠️ Corrige los errores antes de guardar.");
      return;
    }

    try {
      const formData = new FormData();
      for (const key in socio) formData.append(key, socio[key]);

      if (socioEditar && socioEditar.id) {
        await axios.put(
          `http://localhost:4000/api/socios/${socioEditar.id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert("✅ Socio actualizado correctamente");
      } else {
        await axios.post("http://localhost:4000/api/socios", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Socio registrado correctamente");
      }

      refrescar();
      onHide();
    } catch (error) {
      console.error("❌ Error al guardar socio:", error);
      alert("❌ Error al guardar socio");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {socioEditar ? "✏️ Editar socio" : "➕ Registrar nuevo socio"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {[
            { label: "DNI", name: "dni" },
            { label: "Nombres", name: "nombres" },
            { label: "Apellido Paterno", name: "apellidoP" },
            { label: "Apellido Materno", name: "apellidoM" },
            { label: "Teléfono", name: "telefono" },
            { label: "Domicilio", name: "domicilio" },
            { label: "Etapa", name: "etapa" },
            { label: "Número de Lote", name: "numLote" },
            { label: "Manzana", name: "manzana" },
            { label: "Área del Lote (m²)", name: "areaLote" },
            { label: "Monto Total (S/)", name: "montoTotal" },
            { label: "Nombre del Pariente", name: "nombrePariente" },
            { label: "Apellidos del Pariente", name: "apellidosPariente" },
          ].map((f, i) => (
            <Form.Group key={i} className="mb-3">
              <Form.Label>{f.label}</Form.Label>
              <Form.Control
                type={
                  ["areaLote", "montoTotal", "etapa"].includes(f.name)
                    ? "number"
                    : "text"
                }
                name={f.name}
                value={socio[f.name] || ""}
                onChange={handleChange}
                required={!["nombrePariente", "apellidosPariente"].includes(f.name)}
                min={f.name === "areaLote" || f.name === "montoTotal" ? 1 : undefined}
                maxLength={f.name === "dni" ? 8 : f.name === "telefono" ? 9 : undefined}
              />
              {errores[f.name] && (
                <small className="text-danger">{errores[f.name]}</small>
              )}
            </Form.Group>
          ))}

          <Form.Group className="mb-3">
            <Form.Label>Contrato firmado (PDF o imagen)</Form.Label>
            <Form.Control type="file" name="contrato" onChange={handleChange} />

            {socio.contrato && typeof socio.contrato === "string" && (
              <div className="mt-2">
                <small className="text-muted">
                  Archivo actual: <strong>{socio.contrato}</strong>
                </small>
                <br />
                <a
                  href={`http://localhost:4000/uploads/${socio.contrato}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 Ver contrato actual
                </a>
              </div>
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {socioEditar ? "Actualizar socio" : "Guardar socio"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

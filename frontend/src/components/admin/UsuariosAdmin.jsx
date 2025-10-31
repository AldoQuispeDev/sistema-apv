import { useEffect, useState } from "react";
import { Table, Button, Badge, Spinner, Modal, Form } from "react-bootstrap";
import axios from "axios";

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalCargo, setShowModalCargo] = useState(false);
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cargo, setCargo] = useState("PRESIDENTE");

  const [nuevoUsuario, setNuevoUsuario] = useState({
    dni: "",
    nombre: "",
    apellidoP: "",
    apellidoM: "",
    correo: "",
    password: "",
    rol: "SOCIO",
    cargo: "",
  });

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get("https://sistema-apv-backend.onrender.com/api/usuarios", {
        withCredentials: true,
      });
      setUsuarios(res.data);
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const toggleEstado = async (id) => {
    try {
      await axios.put(
        `https://sistema-apv-backend.onrender.com/api/usuarios/estado/${id}`,
        {},
        { withCredentials: true }
      );
      cargarUsuarios();
    } catch (error) {
      alert("Error al cambiar estado del usuario");
      console.error(error);
    }
  };

  const abrirModalCargo = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setCargo("PRESIDENTE");
    setShowModalCargo(true);
  };

  const asignarCargo = async () => {
    try {
      await axios.post(
        "https://sistema-apv-backend.onrender.com/api/usuarios/cargo",
        { usuarioId: usuarioSeleccionado.id, cargo },
        { withCredentials: true }
      );
      alert("✅ Cargo asignado correctamente");
      setShowModalCargo(false);
      cargarUsuarios();
    } catch (error) {
      console.error("❌ Error al asignar cargo:", error);
      alert("Error al asignar cargo");
    }
  };

  // 🆕 Crear nuevo usuario
  const crearUsuario = async () => {
    if (
      !nuevoUsuario.nombre ||
      !nuevoUsuario.apellidoP ||
      !nuevoUsuario.apellidoM ||
      !nuevoUsuario.correo ||
      !nuevoUsuario.password
    ) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      await axios.post(
        "https://sistema-apv-backend.onrender.com/api/usuarios",
        {
          nombre: nuevoUsuario.nombre,
          apellidoP: nuevoUsuario.apellidoP,
          apellidoM: nuevoUsuario.apellidoM,
          correo: nuevoUsuario.correo,
          dni: nuevoUsuario.dni,
          domicilio: "",
          password: nuevoUsuario.password, // 👈 nombre correcto
          rol: nuevoUsuario.rol,
          cargo: nuevoUsuario.cargo || null,
        },
        { withCredentials: true }
      );
      alert("✅ Usuario creado correctamente");
      setShowModalNuevo(false);
      setNuevoUsuario({
        dni: "",
        nombre: "",
        apellidoP: "",
        apellidoM: "",
        correo: "",
        password: "",
        rol: "SOCIO",
        cargo: "",
      });
      cargarUsuarios();
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      alert("Error al crear usuario");
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🧑‍💼 Administración de Usuarios</h4>
        <Button variant="success" onClick={() => setShowModalNuevo(true)}>
          ➕ Nuevo Usuario
        </Button>
      </div>

      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Cargo</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <tr key={u.id}>
              <td>{i + 1}</td>
              <td>{u.dni}</td>
              <td>
                {u.nombre} {u.apellidoP} {u.apellidoM}
              </td>
              <td>{u.correo}</td>
              <td>{u.rol}</td>
              <td>{u.cargo?.cargo || "-"}</td>
              <td>
                {u.activo ? (
                  <Badge bg="success">Activo</Badge>
                ) : (
                  <Badge bg="secondary">Inactivo</Badge>
                )}
              </td>
              <td>
                <Button
                  size="sm"
                  variant={u.activo ? "outline-danger" : "outline-success"}
                  onClick={() => toggleEstado(u.id)}
                  className="me-2"
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => abrirModalCargo(u)}
                >
                  Asignar Cargo
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal para asignar cargo */}
      <Modal show={showModalCargo} onHide={() => setShowModalCargo(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Asignar Cargo Directiva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Select value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="PRESIDENTE">PRESIDENTE</option>
            <option value="SECRETARIO">SECRETARIO</option>
            <option value="TESORERO">TESORERO</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalCargo(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={asignarCargo}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para crear nuevo usuario */}
      <Modal show={showModalNuevo} onHide={() => setShowModalNuevo(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>DNI</Form.Label>
              <Form.Control
                value={nuevoUsuario.dni}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, dni: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                value={nuevoUsuario.nombre}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Apellido Paterno</Form.Label>
              <Form.Control
                value={nuevoUsuario.apellidoP}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, apellidoP: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Apellido Materno</Form.Label>
              <Form.Control
                value={nuevoUsuario.apellidoM}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, apellidoM: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Correo</Form.Label>
              <Form.Control
                type="email"
                value={nuevoUsuario.correo}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={nuevoUsuario.password}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={nuevoUsuario.rol}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
                }
              >
                <option value="SOCIO">SOCIO</option>
                <option value="JUNTA_DIRECTIVA">JUNTA_DIRECTIVA</option>
                <option value="ADMIN">ADMIN</option>
              </Form.Select>
            </Form.Group>

            {nuevoUsuario.rol === "JUNTA_DIRECTIVA" && (
              <Form.Group className="mt-2">
                <Form.Label>Cargo</Form.Label>
                <Form.Select
                  value={nuevoUsuario.cargo}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, cargo: e.target.value })
                  }
                >
                  <option value="">Seleccione un cargo</option>
                  <option value="PRESIDENTE">PRESIDENTE</option>
                  <option value="SECRETARIO">SECRETARIO</option>
                  <option value="TESORERO">TESORERO</option>
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalNuevo(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={crearUsuario}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

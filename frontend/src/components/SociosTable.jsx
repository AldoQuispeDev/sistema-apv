import { useState } from "react";
import { Button, Table, Form, InputGroup, Modal } from "react-bootstrap";
import axios from "axios";

export default function SociosTable({
  socios,
  obtenerAportes,
  refrescar,
  setShowSocioModal,
  setSocioSeleccionado,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [socioAEliminar, setSocioAEliminar] = useState(null);

  // Filtrar socios por búsqueda
  const sociosFiltrados = socios.filter((s) => {
    const texto = busqueda.toLowerCase();
    return (
      s.dni?.toString().includes(texto) ||
      `${s.nombres} ${s.apellidoP} ${s.apellidoM}`.toLowerCase().includes(texto)
    );
  });

  // Eliminar socio
  const eliminarSocio = async () => {
    if (!socioAEliminar?.id) {
      alert("⚠️ No se ha seleccionado ningún socio.");
      return;
    }
    try {
      await axios.delete(`http://localhost:4000/api/socios/${socioAEliminar.id}`, {
        withCredentials: true,
      });
      alert("✅ Socio eliminado correctamente");
      refrescar();
      setShowConfirm(false);
    } catch (error) {
      console.error("❌ Error al eliminar socio:", error.response?.data || error.message);
      alert("❌ Error al eliminar socio");
    }
  };

  return (
    <div>
      {/* BÚSQUEDA */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <InputGroup style={{ width: "400px" }}>
          <Form.Control
            type="text"
            placeholder="🔍 Buscar por DNI o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Button
            variant={busqueda ? "outline-danger" : "outline-secondary"}
            onClick={() => setBusqueda("")}
          >
            🧹
          </Button>
        </InputGroup>
      </div>

      {/* TABLA */}
      <Table striped bordered hover responsive>
        <thead className="table-dark text-center">
          <tr>
            <th>DNI</th>
            <th>Nombre Completo</th>
            <th>Monto Total</th>
            <th>Total Aportado</th>
            <th>Saldo</th>
            <th>Contrato</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sociosFiltrados.length > 0 ? (
            sociosFiltrados.map((socio) => (
              <tr key={socio.id} className="text-center align-middle">
                <td>{socio.dni}</td>
                <td>{`${socio.nombres} ${socio.apellidoP} ${socio.apellidoM}`}</td>
                <td>S/ {socio.montoTotal?.toFixed(2) || 0}</td>
                <td>S/ {socio.totalAportado?.toFixed(2) || 0}</td>
                <td>S/ {socio.saldo?.toFixed(2) || 0}</td>
                <td>
                  {socio.contrato ? (
                    <a
                      href={`http://localhost:4000/uploads/${socio.contrato}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 Ver
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    {/* ✏️ EDITAR */}
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => {
                        setSocioSeleccionado(socio);
                        setShowSocioModal(true);
                      }}
                    >
                      ✏️ Editar
                    </Button>

                    {/* 🗑️ ELIMINAR */}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSocioAEliminar(socio);
                        setShowConfirm(true);
                      }}
                    >
                      🗑️ Eliminar
                    </Button>

                    {/* 🔍 VER APORTES */}
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => obtenerAportes(socio.dni)} // ✅ Ya no depende del modal directamente
                    >
                      🔍 Ver aportes
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center text-muted">
                No se encontraron resultados.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar al socio{" "}
          <strong>{socioAEliminar?.nombres}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={eliminarSocio}>
            Sí, eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

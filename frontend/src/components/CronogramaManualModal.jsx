import { Modal, Button, Form, Table } from "react-bootstrap";
import { useState } from "react";
import axios from "axios";

export default function CronogramaManualModal({ show, onHide, socio, refrescar }) {
  const [filas, setFilas] = useState([
    { cuotaNro: 1, fechaPago: "", monto: "", estado: "PENDIENTE" },
  ]);
  const [guardando, setGuardando] = useState(false);

  const agregarFila = () => {
    setFilas([
      ...filas,
      { cuotaNro: filas.length + 1, fechaPago: "", monto: "", estado: "PENDIENTE" },
    ]);
  };

  const eliminarFila = (i) => setFilas(filas.filter((_, idx) => idx !== i));

  const actualizarCampo = (i, campo, valor) => {
    const temp = [...filas];
    temp[i][campo] = valor;
    setFilas(temp);
  };

  const guardarCronograma = async () => {
    if (!socio?.id) return alert("Socio no válido.");
    if (filas.some((f) => !f.fechaPago || !f.monto))
      return alert("Completa todas las fechas y montos.");

    setGuardando(true);
    try {
      await axios.post(
        "http://localhost:4000/api/cronograma/manual",
        {
          socioId: socio.id,
          cuotas: filas.map((f) => ({
            cuotaNro: f.cuotaNro,
            fechaPago: f.fechaPago,
            monto: parseFloat(f.monto),
            estado: f.estado || "PENDIENTE",
          })),
        },
        { withCredentials: true }
      );
      alert("✅ Cronograma registrado correctamente.");
      refrescar?.();
      onHide();
    } catch (err) {
      console.error(err);
      alert("❌ Error al registrar cronograma.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>📅 Crear Cronograma Manual</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          <b>Socio:</b> {socio?.nombres} {socio?.apellidoP} {socio?.apellidoM}
        </p>

        <Table bordered hover size="sm" className="text-center">
          <thead className="table-secondary">
            <tr>
              <th>#</th>
              <th>Fecha de Pago</th>
              <th>Monto (S/)</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td>{f.cuotaNro}</td>
                <td>
                  <Form.Control
                    type="date"
                    value={f.fechaPago}
                    onChange={(e) => actualizarCampo(i, "fechaPago", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={f.monto}
                    onChange={(e) => actualizarCampo(i, "monto", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Select
                    value={f.estado}
                    onChange={(e) => actualizarCampo(i, "estado", e.target.value)}
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PAGADO">PAGADO</option>
                    <option value="ATRASADO">ATRASADO</option>
                  </Form.Select>
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => eliminarFila(i)}
                  >
                    ❌
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button variant="outline-secondary" onClick={agregarFila}>
          ➕ Agregar fila
        </Button>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={guardarCronograma} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cronograma"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

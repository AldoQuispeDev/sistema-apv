import { useState, useEffect } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import { guardarCronograma, obtenerCronograma } from "../api/cronograma";

export default function CronogramasModal({ show, onHide, contrato }) {
  const [cronograma, setCronograma] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [numCuotas, setNumCuotas] = useState(3);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split("T")[0]);
  const [fechaFinal, setFechaFinal] = useState("");
  const [montoTotal, setMontoTotal] = useState(0);

  // 🔹 Cargar monto total del contrato
  useEffect(() => {
    if (contrato?.montoTotal) setMontoTotal(contrato.montoTotal);
  }, [contrato]);

  // 🔹 Cargar cronograma existente si hay
  useEffect(() => {
    if (show && contrato) cargarCronograma();
  }, [show, contrato]);

  const cargarCronograma = async () => {
    try {
      setCargando(true);
      const data = await obtenerCronograma(contrato.id);
      setCronograma(data);
    } catch (error) {
      console.error("❌ Error al obtener cronograma:", error);
      alert("Error al obtener cronograma");
    } finally {
      setCargando(false);
    }
  };

  // 🧠 Recalcular automáticamente si cambia el número de cuotas
  useEffect(() => {
    if (fechaFinal && montoTotal && numCuotas > 0) {
      generarCronograma(numCuotas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numCuotas]); // 👈 este efecto dispara automáticamente recalculo

  // 📅 Generar cronograma completo (por días)
  const generarCronograma = (cantidad = numCuotas) => {
    if (!cantidad || !fechaInicio || !fechaFinal || !montoTotal) return;

    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinalObj = new Date(fechaFinal);

    if (fechaFinalObj <= fechaInicioObj) {
      alert("⚠️ La fecha final debe ser posterior a la fecha inicial.");
      return;
    }

    const diffDias = Math.floor((fechaFinalObj - fechaInicioObj) / (1000 * 60 * 60 * 24));
    const intervalo = diffDias / (cantidad - 1 || 1);
    const montoBase = montoTotal / cantidad;

    const cuotas = Array.from({ length: cantidad }, (_, i) => {
      const fecha = new Date(fechaInicioObj);
      fecha.setDate(fecha.getDate() + Math.round(i * intervalo));
      return {
        cuotaNro: i + 1,
        fechaPago: fecha.toISOString().split("T")[0],
        monto: parseFloat(montoBase.toFixed(2)),
        estado: "PENDIENTE",
        contratoId: contrato.id,
      };
    });

    // 🔧 Ajustar redondeo en la última cuota
    const suma = cuotas.reduce((acc, c) => acc + c.monto, 0);
    const diferencia = parseFloat((montoTotal - suma).toFixed(2));
    if (Math.abs(diferencia) > 0) {
      cuotas[cuotas.length - 1].monto = parseFloat(
        (cuotas[cuotas.length - 1].monto + diferencia).toFixed(2)
      );
    }

    setCronograma(cuotas);
  };

  // ✏️ Editar campo manual
  const actualizarCampo = (index, campo, valor) => {
    const temp = [...cronograma];
    temp[index][campo] = valor;
    setCronograma(temp);
  };

  // ➕ Agregar fila → aumenta cuotas → recalcula automáticamente
  const agregarFila = () => {
    setNumCuotas((prev) => prev + 1);
  };

  // ❌ Eliminar fila → reduce cuotas → recalcula automáticamente
  const eliminarFila = (index) => {
    if (numCuotas <= 1) return;
    setNumCuotas((prev) => prev - 1);
  };

  // 💾 Guardar cronograma
  const guardarCambios = async () => {
    if (cronograma.length === 0) return alert("No hay cuotas para guardar.");
    setGuardando(true);
    try {
      await guardarCronograma(cronograma);
      alert("✅ Cronograma guardado correctamente.");
      onHide();
    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar cronograma.");
    } finally {
      setGuardando(false);
    }
  };

  const total = cronograma.reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>📅 Cronograma de Pagos {contrato ? `#${contrato.id}` : ""}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ⚙️ Configuración */}
        <div className="border rounded p-3 mb-3">
          <h6>⚙️ Generar Cronograma (en memoria)</h6>
          <div className="row">
            <div className="col-md-3">
              <Form.Label>N° Cuotas</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={numCuotas}
                onChange={(e) => setNumCuotas(parseInt(e.target.value))}
              />
            </div>
            <div className="col-md-3">
              <Form.Label>Fecha Inicio</Form.Label>
              <Form.Control
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <Form.Label>Fecha Final</Form.Label>
              <Form.Control
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <Button variant="primary" className="w-100" onClick={() => generarCronograma(numCuotas)}>
                ⚙️ Generar cronograma
              </Button>
            </div>
          </div>
        </div>

        {/* 🧾 Tabla */}
        {cargando ? (
          <p>Cargando cronograma...</p>
        ) : (
          <>
            <Table bordered hover responsive size="sm">
              <thead className="table-secondary text-center">
                <tr>
                  <th>#</th>
                  <th>Fecha de Pago</th>
                  <th>Monto (S/)</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cronograma.map((c, i) => (
                  <tr key={i}>
                    <td>{c.cuotaNro}</td>
                    <td>
                      <Form.Control
                        type="date"
                        value={c.fechaPago}
                        onChange={(e) => actualizarCampo(i, "fechaPago", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={c.monto}
                        onChange={(e) => actualizarCampo(i, "monto", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Select
                        value={c.estado}
                        onChange={(e) => actualizarCampo(i, "estado", e.target.value)}
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PAGADO">PAGADO</option>
                        <option value="ATRASADO">ATRASADO</option>
                      </Form.Select>
                    </td>
                    <td className="text-center">
                      <Button variant="outline-danger" size="sm" onClick={() => eliminarFila(i)}>
                        ❌
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="fw-bold text-center bg-light">
                  <td colSpan={2}>TOTAL</td>
                  <td>S/ {total.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </Table>

            <Button variant="outline-secondary" onClick={agregarFila}>
              ➕ Agregar fila
            </Button>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button variant="primary" disabled={guardando} onClick={guardarCambios}>
          {guardando ? "Guardando..." : "💾 Guardar cambios"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

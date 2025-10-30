import { useState, useContext, useEffect } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";
import { crearContrato } from "../api/contratos";
import { guardarCronograma } from "../api/cronograma";
import { useNavigate } from "react-router-dom";

export default function ContratoModal({ show, onHide, socios }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 🔹 Estados
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [cronograma, setCronograma] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [numCuotas, setNumCuotas] = useState(3);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState("");
  const [contratoUrl, setContratoUrl] = useState(null);

  // 🧮 Generar cronograma automáticamente
  const generarCronograma = () => {
    if (!socioSeleccionado) return alert("Selecciona un socio.");
    if (!numCuotas || !fechaInicio || !fechaFin)
      return alert("Completa número de cuotas, fecha inicio y final.");

    const total = parseFloat(socioSeleccionado.montoTotal || 0);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin <= inicio) return alert("⚠️ La fecha final debe ser posterior a la inicial.");

    const dias = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
    const intervalo = numCuotas === 1 ? 0 : Math.floor(dias / (numCuotas - 1));
    const montoCuota = total / numCuotas;

    const lista = Array.from({ length: numCuotas }, (_, i) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + Math.round(i * intervalo));
      return {
        cuotaNro: i + 1,
        fechaPago: fecha.toISOString().slice(0, 10),
        monto: parseFloat(montoCuota.toFixed(2)),
        estado: "PENDIENTE",
      };
    });

    // Ajuste de redondeo
    const suma = lista.reduce((acc, c) => acc + c.monto, 0);
    const diferencia = Number((total - suma).toFixed(2));
    if (Math.abs(diferencia) > 0.01)
      lista[lista.length - 1].monto = parseFloat(
        (lista[lista.length - 1].monto + diferencia).toFixed(2)
      );

    setCronograma(lista);
  };

  // ➕ Agregar o ❌ eliminar fila recalculando
  const agregarFila = () => setNumCuotas((prev) => prev + 1);
  const eliminarFila = (i) => {
    if (numCuotas <= 1) return;
    setNumCuotas((prev) => prev - 1);
  };

  // ⚡ Recalcular si cambia el número de cuotas
  useEffect(() => {
    if (socioSeleccionado && fechaInicio && fechaFin) generarCronograma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numCuotas]);

  // ✏️ Editar manualmente un campo
  const actualizarCampo = (i, campo, valor) => {
    const temp = [...cronograma];
    temp[i][campo] = valor;
    setCronograma(temp);
  };

  // 💾 Guardar contrato y cronograma
  const generarContratoFinal = async () => {
    if (!socioSeleccionado) return alert("Selecciona un socio.");
    if (cronograma.length === 0) return alert("Genera primero el cronograma.");

    const totalCron = cronograma.reduce((acc, c) => acc + c.monto, 0);
    const totalSocio = parseFloat(socioSeleccionado.montoTotal || 0);
    if (Number(totalCron.toFixed(2)) !== Number(totalSocio.toFixed(2))) {
      const continuar = confirm(
        `El total del cronograma (S/ ${totalCron.toFixed(
          2
        )}) difiere del monto total del socio (S/ ${totalSocio.toFixed(
          2
        )}). ¿Deseas continuar?`
      );
      if (!continuar) return;
    }

    setGuardando(true);
    try {
      // 1️⃣ Crear contrato base
      const { contrato } = await crearContrato({
        socioId: socioSeleccionado.id,
        usuarioId: user.id,
        ciudadFirma: "Canas",
        fechaFirma: new Date().toISOString(),
      });

      // 2️⃣ Guardar cronograma asociado
      await guardarCronograma(
        cronograma.map((c) => ({
          ...c,
          socioId: socioSeleccionado.id,
          contratoId: contrato.id,
        }))
      );

      setContratoUrl(`/api/generarContratos/${contrato.id}`);
      alert("✅ Contrato y cronograma generados correctamente.");
    } catch (error) {
      console.error(error);
      alert("❌ Error al generar contrato o guardar cronograma.");
    } finally {
      setGuardando(false);
    }
  };

  const total = cronograma.reduce((acc, c) => acc + c.monto, 0);

  return (
    <Modal show={show} onHide={!guardando ? onHide : undefined} size="lg">
      <Modal.Header closeButton={!guardando}>
        <Modal.Title>📄 Generar Contrato y Cronograma</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* SELECCIÓN DE SOCIO */}
        <Form.Group className="mb-3">
          <Form.Label>Seleccionar Socio</Form.Label>
          <Select
            options={socios.map((s) => ({
              value: s.id,
              label: `${s.nombres} ${s.apellidoP} ${s.apellidoM} - DNI: ${s.dni}`,
              socio: s,
            }))}
            placeholder="🔍 Buscar socio..."
            onChange={(opcion) => {
              setSocioSeleccionado(opcion.socio);
              setCronograma([]);
            }}
            isSearchable
          />
        </Form.Group>

        {socioSeleccionado && (
          <>
            <p>
              <b>Socio:</b> {socioSeleccionado.nombres} {socioSeleccionado.apellidoP}{" "}
              {socioSeleccionado.apellidoM}
            </p>
            <p>
              <b>Monto total:</b> S/ {Number(socioSeleccionado.montoTotal || 0).toFixed(2)}
            </p>

            {/* CONFIGURADOR DE CRONOGRAMA */}
            <div className="border rounded p-3 bg-light mb-3">
              <h6>📅 Generar Cronograma (en memoria)</h6>
              <div className="row g-2">
                <div className="col-md-3">
                  <Form.Label>N° Cuotas</Form.Label>
                  <Form.Control
                    type="number"
                    value={numCuotas}
                    min="1"
                    onChange={(e) => setNumCuotas(Number(e.target.value))}
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Fecha Final</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
                <div className="col-md-12 mt-3">
                  <Button variant="outline-primary" onClick={generarCronograma}>
                    ⚙️ Generar cronograma
                  </Button>
                </div>
              </div>
            </div>

            {/* TABLA DE CUOTAS */}
            {cronograma.length > 0 && (
              <>
                <h5>Cronograma de Pagos</h5>
                <Table bordered hover size="sm">
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
                            step="0.01"
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
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="primary" disabled={guardando} onClick={generarContratoFinal}>
          {guardando ? "Procesando..." : "Generar contrato"}
        </Button>
        {contratoUrl && (
          <Button
            variant="success"
            onClick={() => {
              window.open(contratoUrl, "_blank");
              navigate("/dashboard");
            }}
          >
            🔍 Ver contrato
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

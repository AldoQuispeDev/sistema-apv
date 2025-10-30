import { Modal, Button, Table, Badge } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import AporteModal from "./AporteModal";
import CronogramaManualModal from "./CronogramaManualModal"; // 🆕 nuevo modal

export default function AportesModal({ show, onHide, socio, refrescar }) {
  const [cronograma, setCronograma] = useState([]);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);
  const [showAporteModal, setShowAporteModal] = useState(false);
  const [showCronogramaManual, setShowCronogramaManual] = useState(false); // 🆕

  // 📥 Cargar cronograma real del socio desde el backend
  const cargarCronograma = async () => {
    if (!socio?.id) return;
    try {
      const res = await axios.get(
        `http://localhost:4000/api/cronograma/socio/${socio.id}`,
        { withCredentials: true }
      );
      setCronograma(res.data);
    } catch (error) {
      console.error("❌ Error al obtener cronograma:", error);
      setCronograma([]);
    }
  };

  useEffect(() => {
    if (show) cargarCronograma();
  }, [show, socio]);

  // 🏷️ Colores del estado
  const colorEstado = (estado) => {
    switch (estado) {
      case "PAGADO":
        return "success";
      case "ATRASADO":
        return "danger";
      default:
        return "warning";
    }
  };

  // 🗓️ Función para formatear la fecha sin desfase (-1 día)
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getUTCDate()).padStart(2, "0");
    return `${dia}/${mes}/${año}`;
  };

  const abrirModalAporte = (cuota) => {
    setCuotaSeleccionada(cuota);
    setShowAporteModal(true);
  };

  const onAporteGuardado = async () => {
    await cargarCronograma();
    refrescar?.();
    setShowAporteModal(false);
  };

  const onCronogramaGuardado = async () => {
    await cargarCronograma();
    setShowCronogramaManual(false);
  };

  // 🧮 Totales
  const totalPlanificado = cronograma.reduce(
    (sum, c) => sum + Number(c.monto || 0),
    0
  );
  const totalPagado = cronograma.reduce(
    (sum, c) => sum + Number(c.montoPagado || 0),
    0
  );

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            💰 Aportes de {socio?.nombres} {socio?.apellidoP} {socio?.apellidoM}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {cronograma.length === 0 ? (
            <div className="text-center p-4">
              <p>📋 Este socio aún no tiene un cronograma generado.</p>
              <Button
                variant="outline-primary"
                onClick={() => setShowCronogramaManual(true)}
              >
                📅 Crear cronograma manualmente
              </Button>
            </div>
          ) : (
            <Table
              striped
              bordered
              hover
              responsive
              className="text-center align-middle"
            >
              <thead className="table-light">
                <tr>
                  <th>Cuota Nº</th>
                  <th>Fecha de Pago</th>
                  <th>Monto (S/)</th>
                  <th>Monto Pagado (S/)</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cronograma.map((c) => (
                  <tr key={c.id}>
                    <td>{c.cuotaNro}</td>
                    {/* ✅ Corregido: sin desfase de día */}
                    <td>{formatearFecha(c.fechaPago)}</td>
                    <td>{Number(c.monto).toFixed(2)}</td>
                    <td>{Number(c.montoPagado || 0).toFixed(2)}</td>
                    <td>
                      <Badge bg={colorEstado(c.estado)}>{c.estado}</Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={c.estado === "PAGADO"}
                        onClick={() => abrirModalAporte(c)}
                      >
                        ➕ Añadir aporte
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="fw-bold bg-light text-center">
                  <td colSpan={2}>TOTAL</td>
                  <td>S/ {totalPlanificado.toFixed(2)}</td>
                  <td>S/ {totalPagado.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 💵 Modal de aportes */}
      {cuotaSeleccionada && (
        <AporteModal
          show={showAporteModal}
          onHide={() => setShowAporteModal(false)}
          socioId={socio.id}
          cuotaId={cuotaSeleccionada.id}
          monto={cuotaSeleccionada.monto}
          refrescar={onAporteGuardado}
        />
      )}

      {/* 🆕 Modal para crear cronograma manual */}
      {showCronogramaManual && (
        <CronogramaManualModal
          show={showCronogramaManual}
          onHide={() => setShowCronogramaManual(false)}
          socio={socio}
          refrescar={onCronogramaGuardado}
        />
      )}
    </>
  );
}

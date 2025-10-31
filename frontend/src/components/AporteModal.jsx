import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";

export default function AporteModal({ show, onHide, socioId, cuotaId, monto, refrescar }) {
  const [fecha, setFecha] = useState("");
  const [observacion, setObservacion] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [montoEditable, setMontoEditable] = useState(0);

  // 🧩 Recuperar automáticamente el monto de la cuota del cronograma
  useEffect(() => {
    if (monto) {
      setMontoEditable(monto); // Asigna el monto recuperado al campo editable
    }
  }, [monto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!socioId || !cuotaId) return alert("Error: faltan datos del socio o cuota");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("socioId", socioId);
      formData.append("cuotaId", cuotaId);
      formData.append("monto", montoEditable);
      formData.append("fecha", fecha || new Date().toISOString().split("T")[0]);
      formData.append("observacion", observacion);
      if (voucher) formData.append("voucher", voucher);

      await axios.post("https://sistema-apv-backend.onrender.com/api/aportes", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refrescar();
      setFecha("");
      setObservacion("");
      setVoucher(null);
      setLoading(false);
      onHide();
    } catch (error) {
      console.error("❌ Error al registrar aporte:", error);
      alert("No se pudo registrar el aporte.");
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Registrar aporte de la cuota #{cuotaId}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Monto (S/)</Form.Label>
            <Form.Control
              type="number"
              name="monto"
              value={montoEditable}
              onChange={(e) => setMontoEditable(e.target.value)}
              step="0.01"
              min="0"
              required
            />
            <Form.Text className="text-muted">
              Puedes ajustar el monto si el socio depositó una cantidad diferente.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Fecha del depósito</Form.Label>
            <Form.Control
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observación</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Voucher</Form.Label>
            <Form.Control
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setVoucher(e.target.files[0])}
              required
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Form, Button, Table, Badge } from "react-bootstrap";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import { getCumplimiento, getIngresos, getDeudaSocios } from "../api/reportes";

const COLORS = ["#22c55e", "#fbbf24", "#ef4444"]; // Verde, Amarillo, Rojo

export default function ReportesDashboard() {
  const [etapa, setEtapa] = useState(1);
  const [cumplimiento, setCumplimiento] = useState([]);
  const [ingresos, setIngresos] = useState({
    proyectado: 0, recaudado: 0, diferencia: 0, porcentaje: "0.00"
  });
  const [deudaSocios, setDeudaSocios] = useState([]);

  // 🔹 Cargar datos solo por etapa
  const cargar = async () => {
    try {
      const [c, i, d] = await Promise.all([
        getCumplimiento(etapa),
        getIngresos(etapa),
        getDeudaSocios(etapa),
      ]);
      setCumplimiento(c);
      setIngresos(i);
      setDeudaSocios(d);
    } catch (error) {
      console.error("❌ Error al cargar reportes:", error);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  const pieData = useMemo(
    () => cumplimiento.map((x) => ({ name: x.puntualidad, value: Number(x.cantidad) })),
    [cumplimiento]
  );

  // 📥 Exportar reporte de deuda a Excel
  const exportarExcel = () => {
    import("xlsx").then((XLSX) => {
      import("file-saver").then((FileSaver) => {
        const ws = XLSX.utils.json_to_sheet(
          deudaSocios.map((s, i) => ({
            "#": i + 1,
            "DNI": s.dni,
            "Socio": s.socio,
            "Etapa": s.etapa,
            "Manzana": s.manzana,
            "Lote": s.lote,
            "Total (S/)": s.total.toFixed(2),
            "Pagado (S/)": s.pagado.toFixed(2),
            "Deuda (S/)": s.deuda.toFixed(2),
            "Cuotas Atrasadas": s.cuotasAtrasadas,
            "Cumplimiento (%)": s.cumplimiento,
          }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Etapa_${etapa}`);
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        FileSaver.saveAs(blob, `Reporte_Deudas_Etapa_${etapa}.xlsx`);
      });
    });
  };

  return (
    <div className="container py-3">
      <h3 className="mb-3">📊 Reportes Estratégicos por Etapa</h3>

      {/* 🔹 Filtro por etapa */}
      <Card className="mb-3 p-3 shadow-sm border-0">
        <Row className="align-items-end g-3">
          <Col sm={6} md={4}>
            <Form.Label>Seleccionar Etapa (Proyecto)</Form.Label>
            <Form.Select
              value={etapa}
              onChange={(e) => setEtapa(Number(e.target.value))}
            >
              <option value={1}>Etapa 1</option>
              <option value={2}>Etapa 2</option>
              <option value={3}>Etapa 3</option>
            </Form.Select>
          </Col>
          <Col sm={6} md={3}>
            <Button onClick={cargar} className="w-100" variant="primary">
              🔍 Generar Reporte
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 📈 Cumplimiento de Pagos */}
      <Card className="mb-3 p-3">
        <h5 className="mb-3">📈 Cumplimiento de Pagos</h5>
        <Row>
          <Col md={6} style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col md={6}>
            <Table bordered size="sm">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Cantidad</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {cumplimiento.map((x, i) => (
                  <tr key={i}>
                    <td>{x.puntualidad}</td>
                    <td>{x.cantidad}</td>
                    <td>{x.porcentaje}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Card>

      {/* 💰 Ingresos */}
      <Card className="mb-3 p-3">
        <h5 className="mb-3">💰 Ingresos: Proyectado vs Recaudado</h5>
        <Row className="mb-3 text-center">
          <Col>
            <div className="fw-bold">Proyectado</div>
            <div>S/ {ingresos.proyectado?.toFixed?.(2) ?? ingresos.proyectado}</div>
          </Col>
          <Col>
            <div className="fw-bold">Recaudado</div>
            <div>S/ {ingresos.recaudado?.toFixed?.(2) ?? ingresos.recaudado}</div>
          </Col>
          <Col>
            <div className="fw-bold">Diferencia</div>
            <div>S/ {ingresos.diferencia?.toFixed?.(2) ?? ingresos.diferencia}</div>
          </Col>
          <Col>
            <div className="fw-bold">Cumplimiento</div>
            <div>{ingresos.porcentaje}%</div>
          </Col>
        </Row>

        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={[
                { name: "Proyectado", monto: Number(ingresos.proyectado || 0) },
                { name: "Recaudado", monto: Number(ingresos.recaudado || 0) },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="monto" fill="#0d6efd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 🧾 Deuda por socio */}
      <Card className="mb-3 p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">🧾 Deuda Total por Socio (Etapa {etapa})</h5>
          <Button variant="outline-success" size="sm" onClick={exportarExcel}>
            📤 Exportar a Excel
          </Button>
        </div>

        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>DNI</th>
              <th>Socio</th>
              <th>Etapa</th>
              <th>Manzana</th>
              <th>Lote</th>
              <th>Total (S/)</th>
              <th>Pagado (S/)</th>
              <th>Deuda (S/)</th>
              <th>Cuotas Atrasadas</th>
              <th>Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {deudaSocios.map((s, i) => (
              <tr key={s.socioId}>
                <td>{i + 1}</td>
                <td>{s.dni}</td>
                <td>{s.socio}</td>
                <td>{s.etapa}</td>
                <td>{s.manzana}</td>
                <td>{s.lote}</td>
                <td>{s.total.toFixed(2)}</td>
                <td>{s.pagado.toFixed(2)}</td>
                <td className={s.deuda > 0 ? "text-danger" : "text-success"}>
                  {s.deuda.toFixed(2)}
                </td>
                <td>
                  {s.cuotasAtrasadas > 0 ? (
                    <Badge bg="danger">{s.cuotasAtrasadas}</Badge>
                  ) : (
                    <Badge bg="success">0</Badge>
                  )}
                </td>
                <td>{s.cumplimiento}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

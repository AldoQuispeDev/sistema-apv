import { useState } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import UsuariosAdmin from "./UsuariosAdmin";

export default function AdminDashboard() {
  const [vista, setVista] = useState("usuarios");

  return (
    <Container fluid>
      <Row>
        {/* Sidebar */}
        <Col md={3} lg={2} className="bg-dark text-white min-vh-100 p-3">
          <h5 className="text-center mb-4">🧭 Panel Admin</h5>
          <Nav className="flex-column">
            <Nav.Link
              onClick={() => setVista("usuarios")}
              className={`text-white ${vista === "usuarios" ? "fw-bold bg-primary" : ""}`}
            >
              🧑‍💼 Usuarios
            </Nav.Link>
          </Nav>
        </Col>

        {/* Contenido */}
        <Col md={9} lg={10} className="p-4">
          {vista === "usuarios" && <UsuariosAdmin />}
        </Col>
      </Row>
    </Container>
  );
}

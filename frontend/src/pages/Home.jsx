import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Container } from "react-bootstrap";

export default function Home() {
  const navigate = useNavigate();

  const proyectos = [
    { id: 1, nombre: "Proyecto de Lotización - Etapa 1", descripcion: "Zona residencial moderna con acceso a servicios básicos y excelente conectividad." },
    { id: 2, nombre: "Proyecto de Lotización - Etapa 2", descripcion: "Ampliación del proyecto con nuevas áreas verdes, parques y espacios recreativos." },
    { id: 3, nombre: "Proyecto de Lotización - Etapa 3", descripcion: "Etapa final con urbanización consolidada y vistas panorámicas exclusivas." },
  ];

  return (
    <Container className="text-center mt-5">
      {/* LOGO Y ENCABEZADO */}
      <div className="mb-5">
        <img
          src="/logo1.png"
          alt="Logo APV"
          style={{
            width: "500px",
            height: "160px",
            objectFit: "contain",
            marginBottom: "10px",
          }}
        />
        <h1 className="fw-bold text-primary mb-2">
          Asociación Pro Vivienda — Sistema de Gestión
        </h1>
        <p className="text-muted fs-5">
          “Construyendo hogares, creando comunidad y futuro juntos.”
        </p>
      </div>

      {/* TARJETAS DE PROYECTOS */}
      <Row className="justify-content-center">
        {proyectos.map((p) => (
          <Col key={p.id} md={4} className="mb-4">
            <Card className="shadow border-0 h-100" style={{ borderRadius: "15px" }}>
              <Card.Body>
                <Card.Title className="fw-bold text-primary fs-5">
                  {p.nombre}
                </Card.Title>
                <Card.Text className="text-muted">{p.descripcion}</Card.Text>
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={() => navigate(`/dashboard?etapa=${p.id}`)}
                >
                  Ingresar
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <footer className="mt-5 text-muted">
        <small>© 2025 Asociación Pro Vivienda — Todos los derechos reservados.</small>
      </footer>
    </Container>
  );
}

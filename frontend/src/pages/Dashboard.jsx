import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import SociosTable from "../components/SociosTable";
import SocioModal from "../components/SocioModal";
import AportesModal from "../components/AportesModal";
import ContratoModal from "../components/ContratoModal";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [socios, setSocios] = useState([]);
  const [aportes, setAportes] = useState([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const navigate = useNavigate();
  // Modales
  const [showSocioModal, setShowSocioModal] = useState(false);
  const [showAporteModal, setShowAporteModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);

  // 🧭 Obtener etapa desde la URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const etapa = queryParams.get("etapa") || 1;

  // 📥 Obtener socios filtrados por etapa
  const obtenerSocios = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/socios?etapa=${etapa}`, {
        withCredentials: true,
      });
      setSocios(res.data);
    } catch (error) {
      console.error("❌ Error al obtener socios:", error);
    }
  };

  // 📥 Obtener aportes de un socio
  const obtenerAportes = async (dni) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/aportes/${dni}`, {
        withCredentials: true,
      });
      const socio = res.data?.socio || res.data;
      const aportes = res.data?.aportes || [];
      setSocioSeleccionado(socio);
      setAportes(aportes);
      setShowAporteModal(true);
    } catch (error) {
      console.error("❌ Error al obtener aportes:", error);
    }
  };

  useEffect(() => {
    obtenerSocios();
  }, [etapa]); // ✅ se actualiza si cambia la etapa

  return (
    <div className="container mt-4">
      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          Gestión de Socios 🏡 — Etapa {etapa}
        </h2>

        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setSocioSeleccionado(null);
              setShowSocioModal(true);
            }}
          >
            ➕ Registrar socio
          </Button>

          <Button
            variant="outline-success"
            onClick={() => setShowContratoModal(true)}
          >
            📄 Generar contrato y cronograma
          </Button>

          <Button
            variant="info"
            onClick={() => navigate("/reportes")}
          >
            📈 Ver reportes
          </Button>
        </div>
      </div>

      {/* TABLA DE SOCIOS */}
      <SociosTable
        socios={socios}
        obtenerAportes={obtenerAportes}
        refrescar={obtenerSocios}
        setShowSocioModal={setShowSocioModal}
        setSocioSeleccionado={setSocioSeleccionado}
      />

      {/* MODALES */}
      {socioSeleccionado && (
        <AportesModal
          show={showAporteModal}
          onHide={() => setShowAporteModal(false)}
          socio={socioSeleccionado}
          aportes={aportes}
          refrescar={async () => {
            await obtenerAportes(socioSeleccionado.dni);
            await obtenerSocios();
          }}
        />
      )}

      <SocioModal
        show={showSocioModal}
        onHide={() => setShowSocioModal(false)}
        refrescar={obtenerSocios}
        socioEditar={socioSeleccionado}
      />

      <ContratoModal
        show={showContratoModal}
        onHide={() => setShowContratoModal(false)}
        socios={socios}
      />
    </div>
  );
}

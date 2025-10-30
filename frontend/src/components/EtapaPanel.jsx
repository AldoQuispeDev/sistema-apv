import { useState } from "react";
import SocioForm from "./SocioForm";

export default function EtapaPanel({ etapa }) {
  const [socios, setSocios] = useState([]);

  const agregarSocio = (nuevoSocio) => {
    setSocios([...socios, nuevoSocio]);
  };

  return (
    <div className="card p-4 shadow-sm">
      <h4 className="mb-3">Etapa {etapa}</h4>

      <SocioForm onRegistrar={agregarSocio} etapa={etapa} />

      <table className="table table-striped mt-4">
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Teléfono</th>
            <th>Pariente</th>
            <th>N° Lote</th>
            <th>Manzana</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {socios.map((s, i) => (
            <tr key={i}>
              <td>{s.dni}</td>
              <td>{s.nombres}</td>
              <td>{`${s.apellidoP} ${s.apellidoM}`}</td>
              <td>{s.telefono}</td>
              <td>{s.pariente}</td>
              <td>{s.nroLote}</td>
              <td>{s.manzana}</td>
              <td>S/{s.monto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

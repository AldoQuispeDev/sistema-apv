export default function AportesTable({ aportes }) {
  const totalAportado = aportes.reduce((acc, a) => acc + a.monto, 0);

  return (
    <div className="mt-3">
      <table className="table table-bordered text-center align-middle">
        <thead className="table-secondary">
          <tr>
            <th>#</th>
            <th>Fecha de Depósito</th>
            <th>Monto (S/)</th>
            <th>Observación</th>
            <th>Voucher</th>
          </tr>
        </thead>
        <tbody>
          {aportes.length === 0 ? (
            <tr>
              <td colSpan="5">⚠️ No hay aportes registrados aún.</td>
            </tr>
          ) : (
            aportes.map((a, index) => (
              <tr key={a.id}>
                <td>{index + 1}</td>
                <td>{new Date(a.fecha).toLocaleDateString()}</td>
                <td>S/ {a.monto.toFixed(2)}</td>
                <td>{a.observacion || "—"}</td>
                <td>
                  {a.voucher ? (
                    <a
                      href={`${import.meta.env.VITE_BACKEND_URL}/uploads/vouchers/${a.voucher}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📎 Archivo
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-3">
        <strong>Total aportado:</strong> S/ {totalAportado.toFixed(2)}
      </div>
    </div>
  );
}

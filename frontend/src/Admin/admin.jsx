import { useEffect, useMemo, useState } from "react";
import { getAdminTickets, adminPayTicket, adminFreeTicket } from "../api";
import "./Admin.css";

const RAFFLE_ID = 1;

export default function Admin() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminTickets(RAFFLE_ID);
      setTickets(data.tickets || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "free") return tickets.filter(t => t.status === "free");
    if (filter === "reserved") return tickets.filter(t => t.status === "reserved");
    if (filter === "paid") return tickets.filter(t => t.status === "paid");
    return tickets;
  }, [tickets, filter]);

  const totalTickets = tickets.length;
  const reservedCount = tickets.filter(t => t.status === "reserved").length;
  const paidCount = tickets.filter(t => t.status === "paid").length;

  async function onPay(number) {
    try {
      await adminPayTicket(RAFFLE_ID, number);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onFree(number) {
    try {
      await adminFreeTicket(RAFFLE_ID, number);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="adminPage">
      <header className="adminHeader">
        <h1>Panel de Administración</h1>
        <span>Rifa ID: {RAFFLE_ID}</span>
      </header>

      <section className="stats">
        <div className="stat">
          <span>Total boletos</span>
          <strong>{totalTickets}</strong>
        </div>
        <div className="stat">
          <span>Apartados</span>
          <strong>{reservedCount}</strong>
        </div>
        <div className="stat">
          <span>Pagados</span>
          <strong>{paidCount}</strong>
        </div>
        <div className="stat">
          <span>Refrescar</span>
          <button className="pay" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </section>

      <section className="tableCard">
        <div className="tableHeader">
          <h2>Boletos</h2>

          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="free">Libres</option>
            <option value="reserved">Apartados</option>
            <option value="paid">Pagados</option>
          </select>
        </div>

        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Status</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(t => (
                <tr key={t.number}>
                  <td>{String(t.number).padStart(4, "0")}</td>
                  <td>{t.name ? `${t.name} ${t.lastname || ""}` : "-"}</td>
                  <td>{t.phone || "-"}</td>
                  <td>{t.state || "-"}</td>
                  <td>
                    <span className={`badge ${t.status}`}>{t.status}</span>
                  </td>
                  <td className="actions">
                    <button className="pay" onClick={() => onPay(t.number)}>
                      Pagado
                    </button>
                    <button className="free" onClick={() => onFree(t.number)}>
                      Liberar
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                    No hay boletos para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

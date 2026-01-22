// App.jsx
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { getTickets, reserveTickets } from "./api";
import Admin from "./Admin/admin";
import "./App.css";

const RAFFLE_ID = 1;
const TICKET_PRICE = 100;

const PHOTOS = [
  "/car1.jpg",
  "/OIP.webp",
  "/31-1-768x362.png",
  "/2023-ford-f-150-raptor-r.jpg",
];

/* =========================
   HEADER SUPERIOR
========================= */
function TopBar() {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <div className="topbarLogo">
          <span className="topbarLogoText">LOGO</span>
        </div>

        <nav className="topbarNav">
          <a href="#inicio" className="topbarLink">Inicio</a>
          <a href="#faq" className="topbarLink">Preguntas Frecuentes</a>
          <a href="#contacto" className="topbarLink">Contacto</a>
          <a href="#pagos" className="topbarLink">Métodos de Pago</a>
          <a href="#comprar" className="topbarLink buy">Comprar Boletos</a>
        </nav>
      </div>
    </header>
  );
}

/* =========================
   PÁGINA PRINCIPAL (RIFAS)
========================= */
function Rifa() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [view, setView] = useState("grid");

  const [form, setForm] = useState({
    phone: "",
    name: "",
    lastname: "",
    state: "QUERÉTARO",
  });

  const [photoA, setPhotoA] = useState(0);
  const [photoB, setPhotoB] = useState(1);

  const total = useMemo(() => selected.size * TICKET_PRICE, [selected]);
  const selectedList = useMemo(
    () => Array.from(selected).sort((a, b) => a - b),
    [selected]
  );

  async function loadTickets() {
    const data = await getTickets(RAFFLE_ID);
    setTickets(data?.tickets || []);
  }

  useEffect(() => {
    loadTickets().catch(console.error);
  }, []);

  function toggleTicket(n, status) {
    if (status !== "free") return;

    setSelected(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  async function confirmReserve() {
    if (selected.size === 0) return alert("Selecciona al menos 1 boleto");

    const payload = {
      raffleId: RAFFLE_ID,
      tickets: selectedList,
      phone: form.phone.trim(),
      name: form.name.trim(),
      lastname: form.lastname.trim(),
      state: form.state.trim(),
    };

    if (!payload.phone || !payload.name || !payload.lastname || !payload.state) {
      return alert("Completa tus datos");
    }

    try {
      const r = await reserveTickets(payload);

      const msg = encodeURIComponent(
        `APARTADO DE BOLETOS\n` +
          `Rifa: ${r.raffleId}\n` +
          `Nombre: ${payload.name} ${payload.lastname}\n` +
          `Tel: ${payload.phone}\n` +
          `Estado: ${payload.state}\n` +
          `Boletos: ${r.tickets.join(", ")}\n` +
          `Total: $${r.total}`
      );

      window.open(`https://wa.me/524461443198?text=${msg}`, "_blank");

      alert("Boletos apartados ✅");
      setSelected(new Set());
      setView("grid");
      await loadTickets();
    } catch (e) {
      alert(e.message || "Error al apartar");
    }
  }

  const totalTickets = tickets.length;
  const reservedCount = tickets.filter(t => t.status === "reserved").length;
  const paidCount = tickets.filter(t => t.status === "paid").length;

  return (
    <>
      {/* 🔴 TOP BAR */}
      <TopBar />

      {/* 🔽 CONTENIDO */}
      <div className="page" id="inicio">
        {/* ===== SIDEBAR ===== */}
        <aside className="sidebar">
          <div className="sideHead">
            <div className="sideTitle">Boletos seleccionados</div>
            <div className="sideCount">{selected.size} seleccionados</div>
          </div>

          <div className="padX">
            {selected.size === 0 ? (
              <p className="muted">No has seleccionado boletos.</p>
            ) : (
              <div className="chips">
                {selectedList.map(n => (
                  <span key={n} className="chip">
                    {String(n).padStart(4, "0")}
                  </span>
                ))}
              </div>
            )}

            <div className="total">
              <div>Total</div>
              <strong>${total}</strong>
            </div>

            <p className="muted">
              Selecciona boletos disponibles (rojos). Al confirmar, te pedirá tus
              datos para apartarlos.
            </p>
          </div>

          {view === "grid" ? (
            <>
              <button
                className="btn"
                disabled={selected.size === 0}
                onClick={() => setView("confirm")}
              >
                Confirmar boletos
              </button>

              <button className="btn secondary" onClick={() => navigate("/admin")}>
                Admin
              </button>
            </>
          ) : (
            <>
              <div className="padX">
                <div className="form">
                  <input
                    placeholder="Teléfono"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                  <input
                    placeholder="Nombre"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    placeholder="Apellido"
                    value={form.lastname}
                    onChange={e =>
                      setForm({ ...form, lastname: e.target.value })
                    }
                  />
                  <select
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                  >
                    <option>AGUASCALIENTES</option>
                    <option>BAJA CALIFORNIA</option>
                    <option>BAJA CALIFORNIA SUR</option>
                    <option>CAMPECHE</option>
                    <option>CHIAPAS</option>
                    <option>CHIHUAHUA</option>
                    <option>CIUDAD DE MÉXICO</option>
                    <option>COAHUILA</option>
                    <option>COLIMA</option>
                    <option>DURANGO</option>
                    <option>ESTADO DE MÉXICO</option>
                    <option>GUANAJUATO</option>
                    <option>GUERRERO</option>
                    <option>HIDALGO</option>
                    <option>JALISCO</option>
                    <option>MICHOACÁN</option>
                    <option>MORELOS</option>
                    <option>NAYARIT</option>
                    <option>NUEVO LEÓN</option>
                    <option>OAXACA</option>
                    <option>PUEBLA</option>
                    <option>QUERÉTARO</option>
                    <option>QUINTANA ROO</option>
                    <option>SAN LUIS POTOSÍ</option>
                    <option>SINALOA</option>
                    <option>SONORA</option>
                    <option>TABASCO</option>
                    <option>TAMAULIPAS</option>
                    <option>TLAXCALA</option>
                    <option>VERACRUZ</option>
                    <option>YUCATÁN</option>
                    <option>ZACATECAS</option>
                  </select>
                </div>
              </div>

              <button className="btn" onClick={confirmReserve}>
                Apartar
              </button>

              <button className="btn secondary" onClick={() => setView("grid")}>
                Volver
              </button>
            </>
          )}
        </aside>

        {/* ===== MAIN (CENTRO) ===== */}
        <main className="main" id="comprar">
          <div className="mainHeader">
            <div className="brand">
              <div className="logo" />
              <div>
                <div className="brandTitle">RIFAS</div>
                <div className="brandSub">
                  Selecciona tus boletos y aparta por WhatsApp
                </div>
              </div>
            </div>

            <div className="pills">
              <div className="pill">Boleto: ${TICKET_PRICE}</div>
              <div className="pill">Rifa ID: {RAFFLE_ID}</div>
            </div>
          </div>

          <div className="mainInner">
            <h1>Rifa</h1>
            <p className="muted">Da click para seleccionar</p>

            <div className="legend">
              <div className="legendItem">
                <span className="dot free" /> Libre
              </div>
              <div className="legendItem">
                <span className="dot reserved" /> Apartado
              </div>
              <div className="legendItem">
                <span className="dot paid" /> Pagado
              </div>
              <div className="legendItem">
                <span className="dot selected" /> Seleccionado
              </div>
            </div>

            <div className="ticketsScroll">
              <div className="grid">
                {tickets.map(t => {
                  const isSelected = selected.has(t.number);

                  const cls = [
                    "ticket",
                    t.status,
                    t.status === "free" ? "free" : "",
                    isSelected ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={t.number}
                      className={cls}
                      onClick={() => toggleTicket(t.number, t.status)}
                      title={t.status}
                      type="button"
                    >
                      {String(t.number).padStart(4, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* ===== PANEL DERECHO ===== */}
        <section className="rightPanel">
          <div className="rightCard">
            <div className="gallery">
              <div className="galleryTop">
                <div className="galleryBig">
                  <img src={PHOTOS[photoA]} alt="foto A" />
                </div>
                <div className="galleryBig">
                  <img src={PHOTOS[photoB]} alt="foto B" />
                </div>
              </div>

              <div className="thumbs">
                {PHOTOS.map((src, idx) => {
                  const active = idx === photoA || idx === photoB;
                  return (
                    <button
                      key={src}
                      className={`thumb ${active ? "active" : ""}`}
                      onClick={() => {
                        if (idx === photoA || idx === photoB) return;
                        setPhotoA(photoB);
                        setPhotoB(idx);
                      }}
                      type="button"
                    >
                      <img src={src} alt={`thumb ${idx}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="raffleInfo" id="faq">
              <div className="raffleTitle">EXOTICA FORD RAPTOR 2024</div>
              <div className="raffleSubtitle">4x4 + $30,000 MXN</div>

              <div className="infoGrid">
                <div className="infoRow">
                  <span>Fecha sorteo</span>
                  <strong>2026-01-13 20:26</strong>
                </div>
                <div className="infoRow">
                  <span>Precio boleto</span>
                  <strong>${TICKET_PRICE}</strong>
                </div>
                <div className="infoRow">
                  <span>Boletos totales</span>
                  <strong>{totalTickets}</strong>
                </div>
                <div className="infoRow">
                  <span>Apartados</span>
                  <strong>{reservedCount}</strong>
                </div>
                <div className="infoRow">
                  <span>Pagados</span>
                  <strong>{paidCount}</strong>
                </div>
                <div className="infoRow">
                  <span>Seleccionados</span>
                  <strong>{selected.size}</strong>
                </div>
              </div>

              <div className="note" id="contacto">
                Tip: si apartas, se abrirá WhatsApp con el mensaje listo para
                enviar. El admin confirmará el pago más adelante.
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================
   APP + RUTAS
========================= */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Rifa />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

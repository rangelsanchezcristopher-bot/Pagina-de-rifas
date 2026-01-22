// backend/src/routes.js
const express = require("express");
const pool = require("./db");

const router = express.Router();

/* =========================
   SALUD
========================= */
router.get("/health", (req, res) => res.json({ ok: true }));

/* =========================
   RIFA ACTUAL (la primera)
========================= */
router.get("/raffle/current", async (req, res) => {
  try {
    const [[raffle]] = await pool.query(
      "SELECT id, title, description, draw_date, main_prize, ticket_price FROM raffles ORDER BY id ASC LIMIT 1"
    );
    if (!raffle) return res.status(404).json({ ok: false, error: "No hay rifas" });
    res.json({ ok: true, raffle });
  } catch (e) {
    console.error("ERROR /raffle/current =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  }
});

/* =========================
   OBTENER BOLETOS (para la web)
========================= */
router.get("/tickets/:raffleId", async (req, res) => {
  try {
    const raffleId = Number(req.params.raffleId);
    if (!Number.isFinite(raffleId)) {
      return res.status(400).json({ ok: false, error: "raffleId inválido" });
    }

    const [tickets] = await pool.query(
      "SELECT number, status FROM tickets WHERE raffle_id=? ORDER BY number ASC",
      [raffleId]
    );

    res.json({ ok: true, raffleId, tickets });
  } catch (e) {
    console.error("ERROR /tickets/:raffleId =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  }
});

/* =========================
   APARTAR BOLETOS (transacción + bloqueo)
========================= */
router.post("/reserve", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { raffleId, tickets, phone, name, lastname, state } = req.body;

    const rId = Number(raffleId);
    if (!Number.isFinite(rId)) {
      return res.status(400).json({ ok: false, error: "raffleId inválido" });
    }

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ ok: false, error: "tickets vacío" });
    }

    const nums = [...new Set(tickets.map(Number))].filter(
      (n) => Number.isFinite(n) && n >= 1
    );
    if (nums.length === 0) {
      return res.status(400).json({ ok: false, error: "tickets inválidos" });
    }

    if (!phone || !name || !lastname || !state) {
      return res.status(400).json({ ok: false, error: "faltan datos" });
    }

    await conn.beginTransaction();

    // precio
    const [[raffle]] = await conn.query("SELECT ticket_price FROM raffles WHERE id=?", [rId]);
    if (!raffle) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Rifa no encontrada" });
    }
    const price = raffle.ticket_price ?? 100;

    // bloquear boletos seleccionados
    const placeholders = nums.map(() => "?").join(",");
    const [rows] = await conn.query(
      `SELECT number, status FROM tickets
       WHERE raffle_id=? AND number IN (${placeholders})
       FOR UPDATE`,
      [rId, ...nums]
    );

    const found = new Map(rows.map((r) => [r.number, r.status]));
    const missing = nums.filter((n) => !found.has(n));
    if (missing.length) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "Boletos no existen", missing });
    }

    const notFree = nums.filter((n) => found.get(n) !== "free");
    if (notFree.length) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "Boletos no disponibles", notFree });
    }

    // actualizar a reserved
    await conn.query(
      `UPDATE tickets
       SET status='reserved',
           reserved_name=?,
           reserved_lastname=?,
           reserved_phone=?,
           reserved_state=?,
           reserved_at=NOW()
       WHERE raffle_id=? AND number IN (${placeholders}) AND status='free'`,
      [
        String(name).toUpperCase(),
        String(lastname).toUpperCase(),
        String(phone),
        String(state).toUpperCase(),
        rId,
        ...nums,
      ]
    );

    const total = price * nums.length;

    // guardar en reservations
    const [ins] = await conn.query(
      `INSERT INTO reservations (raffle_id, phone, name, lastname, state, tickets_json, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        rId,
        String(phone),
        String(name).toUpperCase(),
        String(lastname).toUpperCase(),
        String(state).toUpperCase(),
        JSON.stringify(nums),
        total,
      ]
    );

    await conn.commit();

    res.json({
      ok: true,
      reservationId: ins.insertId,
      raffleId: rId,
      tickets: nums,
      total,
      totalAmount: total,
      ticketPrice: price,
    });
  } catch (e) {
    await conn.rollback();
    console.error("ERROR /reserve =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  } finally {
    conn.release();
  }
});

/* ======================================================
   ====================== ADMIN ==========================
====================================================== */

/* ADMIN: LISTAR BOLETOS CON DATOS (SIN paid_at) */
router.get("/admin/tickets", async (req, res) => {
  try {
    const raffleId = Number(req.query.raffleId || 1);
    if (!Number.isFinite(raffleId)) {
      return res.status(400).json({ ok: false, error: "raffleId inválido" });
    }

    const [rows] = await pool.query(
      `SELECT
         number,
         status,
         reserved_name,
         reserved_lastname,
         reserved_phone,
         reserved_state,
         reserved_at
       FROM tickets
       WHERE raffle_id=?
       ORDER BY number ASC`,
      [raffleId]
    );

    const tickets = rows.map((t) => ({
      number: t.number,
      status: t.status,
      name: t.reserved_name || null,
      lastname: t.reserved_lastname || null,
      phone: t.reserved_phone || null,
      state: t.reserved_state || null,
      reserved_at: t.reserved_at || null,
    }));

    res.json({ ok: true, raffleId, tickets });
  } catch (e) {
    console.error("ERROR /admin/tickets =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  }
});

/* ADMIN: MARCAR BOLETO COMO PAGADO (solo status) */
router.put("/admin/tickets/:raffleId/:number/pay", async (req, res) => {
  try {
    const raffleId = Number(req.params.raffleId);
    const number = Number(req.params.number);

    if (!Number.isFinite(raffleId) || !Number.isFinite(number)) {
      return res.status(400).json({ ok: false, error: "parámetros inválidos" });
    }

    const [r] = await pool.query(
      `UPDATE tickets
       SET status='paid'
       WHERE raffle_id=? AND number=?`,
      [raffleId, number]
    );

    res.json({ ok: true, affectedRows: r.affectedRows });
  } catch (e) {
    console.error("ERROR /admin/tickets/pay =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  }
});

/* ADMIN: LIBERAR BOLETO (volver a free y limpiar datos reserved_*) */
router.put("/admin/tickets/:raffleId/:number/free", async (req, res) => {
  try {
    const raffleId = Number(req.params.raffleId);
    const number = Number(req.params.number);

    if (!Number.isFinite(raffleId) || !Number.isFinite(number)) {
      return res.status(400).json({ ok: false, error: "parámetros inválidos" });
    }

    const [r] = await pool.query(
      `UPDATE tickets
       SET status='free',
           reserved_name=NULL,
           reserved_lastname=NULL,
           reserved_phone=NULL,
           reserved_state=NULL,
           reserved_at=NULL
       WHERE raffle_id=? AND number=?`,
      [raffleId, number]
    );

    res.json({ ok: true, affectedRows: r.affectedRows });
  } catch (e) {
    console.error("ERROR /admin/tickets/free =>", e);
    res.status(500).json({ ok: false, error: e.sqlMessage || e.message || "Error interno" });
  }
});

module.exports = router;

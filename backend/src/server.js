const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes");

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors({
  origin: "*", // luego lo restringimos
}));
app.use(express.json());

/* =========================
   ARCHIVOS ESTÁTICOS (WEB)
========================= */
app.use(express.static(path.join(__dirname, "../public")));

/* =========================
   API
========================= */
app.use("/api", apiRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date() });
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

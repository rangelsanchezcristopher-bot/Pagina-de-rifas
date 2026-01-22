const grid = document.getElementById("grid");
const selectedList = document.getElementById("selectedList");
const confirmBtn = document.getElementById("confirmBtn");
const clearBtn = document.getElementById("clearBtn");

const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalSub = document.getElementById("modalSub");
const reserveForm = document.getElementById("reserveForm");

const stateEl = document.getElementById("state");
const phoneEl = document.getElementById("phone");
const nameEl = document.getElementById("name");
const lastnameEl = document.getElementById("lastname");

// CONFIG
const WHATSAPP_NUMBER = "524424472411"; // +52 + número
const PRICE_PER_TICKET = 100;
const RAFFLE_NAME = "RIFA EXOTICA FORD RAPTOR 2024";

// Cambia aquí el total de boletos (ej. 5000, 60000, etc.)
const TOTAL_TICKETS = 1000;

let selected = new Set();
let buttonsByNumber = new Map();

function pad4(n) {
  return String(n).padStart(4, "0");
}

function renderGrid() {
  grid.innerHTML = "";
  buttonsByNumber.clear();

  for (let i = 1; i <= TOTAL_TICKETS; i++) {
    const btn = document.createElement("button");
    btn.className = "ticket";
    btn.textContent = pad4(i);
    btn.dataset.num = String(i);

    btn.addEventListener("click", () => toggleTicket(i));

    grid.appendChild(btn);
    buttonsByNumber.set(i, btn);
  }

  syncSelectedStyles();
}

function toggleTicket(num) {
  if (selected.has(num)) selected.delete(num);
  else selected.add(num);

  syncSelectedStyles();
  renderSelectedList();
}

function syncSelectedStyles() {
  for (const [num, btn] of buttonsByNumber.entries()) {
    if (selected.has(num)) btn.classList.add("selected");
    else btn.classList.remove("selected");
  }
}

function renderSelectedList() {
  selectedList.innerHTML = "";

  const arr = Array.from(selected).sort((a, b) => a - b);

  arr.forEach((num) => {
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = pad4(num);
    pill.title = "Quitar";
    pill.addEventListener("click", () => {
      selected.delete(num);
      syncSelectedStyles();
      renderSelectedList();
    });
    selectedList.appendChild(pill);
  });

  confirmBtn.disabled = arr.length === 0;
}

function openModal() {
  const count = selected.size;
  const total = count * PRICE_PER_TICKET;
  modalSub.textContent = `${count} BOLETO${count === 1 ? "" : "S"} • $${total} MXN`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function whatsappMessage(data) {
  const tickets = Array.from(selected).sort((a, b) => a - b).map(pad4).join(", ");
  const count = selected.size;
  const total = count * PRICE_PER_TICKET;

  return (
`Hola! Quiero APARTAR boletos.
Rifa: ${RAFFLE_NAME}
Boletos: ${tickets}
Cantidad: ${count}
Total: $${total} MXN ($${PRICE_PER_TICKET} c/u)

Nombre: ${data.name} ${data.lastname}
Teléfono: ${data.phone}
Estado: ${data.state}

Enviado desde la página web.`
  );
}

function goWhatsapp(text) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// Eventos
confirmBtn.addEventListener("click", openModal);

clearBtn.addEventListener("click", () => {
  selected.clear();
  syncSelectedStyles();
  renderSelectedList();
});

modalBackdrop.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);

reserveForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    phone: phoneEl.value.trim(),
    name: nameEl.value.trim().toUpperCase(),
    lastname: lastnameEl.value.trim().toUpperCase(),
    state: stateEl.value.trim().toUpperCase(),
  };

  if (!data.phone || !data.name || !data.lastname || !data.state) return;

  const msg = whatsappMessage(data);
  closeModal();
  goWhatsapp(msg);
});

// Inicial
renderGrid();
renderSelectedList();

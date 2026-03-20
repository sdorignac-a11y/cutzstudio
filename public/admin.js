const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:5000/api"
  : "https://myassistantforeal.onrender.com/api";

window.API_BASE = API_BASE;
console.log("[admin] API_BASE =", API_BASE);

function showLoader(msg = "Verificando tu cuenta...") {
  const l = document.getElementById("loader");
  const p = l?.querySelector("p");
  if (p) p.textContent = msg;
  if (l) {
    l.style.display = "flex";
    l.style.opacity = "1";
  }
  const c = document.getElementById("contenido");
  if (c) c.style.display = "none";
}
function hideLoader() {
  const l = document.getElementById("loader");
  const c = document.getElementById("contenido");
  if (!l) return;
  setTimeout(() => {
    l.style.transition = "opacity .5s ease";
    l.style.opacity = "0";
    setTimeout(() => {
      l.style.display = "none";
      if (c) c.style.display = "block";
    }, 500);
  }, 800);
}
showLoader();

function aplicarSoloExperto(plan) {
  const isExpert = String(plan || "").toLowerCase() === "experto";
  document.querySelectorAll("[data-only-expert]").forEach((el) => {
    el.style.display = isExpert ? "" : "none";
  });
}


// =====================================
document.addEventListener("DOMContentLoaded", () => {
  window.lucide?.createIcons?.();

  const btnOCR = document.getElementById("btnExtraerImagen");
  const sidebarBtns = document.querySelectorAll(".sidebar-btn");
  const ocrSection = document.getElementById("extraer-imagen");
  const mainContent = document.querySelector("main");

  if (btnOCR && ocrSection && mainContent) {
    btnOCR.addEventListener("click", (e) => {
      e.preventDefault();

      sidebarBtns.forEach((b) => b.classList.remove("active"));
      btnOCR.classList.add("active");

      const sectionRect = ocrSection.getBoundingClientRect();

      if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
        const mainRect = mainContent.getBoundingClientRect();
        const offsetInMain =
          mainContent.scrollTop + (sectionRect.top - mainRect.top);
        mainContent.scrollTo({ top: offsetInMain, behavior: "smooth" });
      } else {
        window.scrollTo({
          top: window.scrollY + sectionRect.top - 80,
          behavior: "smooth",
        });
      }
    });
  }
});

// ====== Estado global ======
// Helpers de trial y plan
function toMillis(ts) {
  if (!ts && ts !== 0) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const n = Number(ts);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof ts === "object" && typeof ts.seconds === "number") {
    return ts.seconds * 1000;
  }
  return 0;
}

function isTrialActive(data) {
  const approved = !!data.trialApproved;
  const endsAtMs = toMillis(data.trialEndsAt);
  return approved && endsAtMs > Date.now();
}

// Solo mapear trial→experto cuando el trial esté activo
function effectivePlanFromData(rawPlan, data) {
  const p = String(rawPlan || "free").toLowerCase();
  if (p === "trial") return isTrialActive(data) ? "experto" : "free";
  return p;
}

function startTrialCountdown(trialEndsAt) {
  const endMs = toMillis(trialEndsAt);
  if (!endMs) return;

  // Crear/ubicar el contenedor debajo del tipo de plan
  let el = document.getElementById("trial-countdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "trial-countdown";
    el.style.marginTop = "6px";
    el.style.fontSize = "0.95rem";
    el.style.color = "#f59e0b";
    const host =
      (planTipoEl && planTipoEl.parentElement) || planPanel || document.body;
    host.appendChild(el);
  }

  let timer = null;

  const tick = () => {
    const diff = endMs - Date.now();
    if (diff <= 0) {
      el.textContent = "⏳ Tu período de prueba terminó.";
      if (timer) clearInterval(timer);

      // 🔒 Ocultar el panel
      const appWrap = document.getElementById("admin-wrapper");
      if (appWrap) {
        appWrap.style.display = "none";
        appWrap.style.pointerEvents = "none";
      }

      // 🪟 Mostrar modal (una vez por sesión)
      if (!sessionStorage.getItem("trial_expired_shown")) {
        sessionStorage.setItem("trial_expired_shown", "1");
        showTrialExpiredModal({
          onUpgrade: () => (window.location.href = "index.html#planes"),
          onContact: () =>
            window.open(
              "https://www.instagram.com/myassistant.ai/",
              "_blank"
            ),
          hideApp: true,
        });
      }

      // ⛳️ Redirigir por seguridad
      setTimeout(() => window.location.replace("index.html#planes"), 800);
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const fecha = new Date(endMs).toISOString().replace("T", " ").slice(0, 16);
    el.textContent = `⏳ Trial activo — vence en ${d}d ${h}h ${m}m (hasta ${fecha})`;
  };

  tick();
  timer = setInterval(tick, 60_000);
}

function showTrialExpiredModal(opts = {}) {
  if (document.getElementById("trialExpiredOverlay")) return;

  const { onUpgrade, onContact, hideApp = true } = opts;

  const app = document.getElementById("admin-wrapper");
  const unblur = () => {
    if (app) {
      app.style.filter = "";
      app.style.pointerEvents = "";
    }
  };
  if (hideApp && app) {
    app.style.filter = "blur(2px)";
    app.style.pointerEvents = "none";
  }

  const overlay = document.createElement("div");
  overlay.id = "trialExpiredOverlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: grid; place-items: center;
    backdrop-filter: blur(6px);
    background: rgba(2,6,23,.55);
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    width: min(560px, 92vw);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
    background: linear-gradient(135deg, #0b1220 0%, #0f172a 60%, #111827 100%);
    color: #e5e7eb;
    border: 1px solid rgba(148,163,184,.2);
    transform: translateY(12px);
    opacity: 0;
    transition: all .25s ease;
  `;

  const header = document.createElement("div");
  header.style.cssText = `padding: 22px 22px 10px 22px; display: flex; align-items: center; gap: 12px;`;
  header.innerHTML = `
    <div style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;
      background: radial-gradient(circle at 30% 30%, #f59e0b 0%, #ef4444 60%, #7c3aed 100%);
      box-shadow: inset 0 0 20px rgba(255,255,255,.2);">
      <span style="font-size:22px;">⏰</span>
    </div>
    <div>
      <div style="font-size:18px;font-weight:800;letter-spacing:.2px">Tu período de prueba terminó</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:2px">Para seguir usando todas las funciones, elegí un plan.</div>
    </div>
  `;

  const body = document.createElement("div");
  body.style.cssText = `padding: 8px 22px 16px 22px;`;
  body.innerHTML = `
    <ul style="margin:8px 0 0 0;padding:0;list-style:none;color:#cbd5e1;font-size:14px;line-height:1.4">
      <li style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span>✅</span> Acceso a scraping y OCR.</li>
      <li style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span>✅</span> Mensajes automáticos por día y keywords.</li>
      <li style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span>✅</span> Soporte prioritario.</li>
    </ul>
  `;

  const footer = document.createElement("div");
  footer.style.cssText = `padding: 16px 22px 22px 22px; display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;`;

  const btnPlanes = document.createElement("button");
  btnPlanes.textContent = "Ver planes";
  btnPlanes.style.cssText = `
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none; color: white; font-weight: 700; letter-spacing:.2px;
    padding: 10px 14px; border-radius: 12px; cursor: pointer;
    box-shadow: 0 8px 20px rgba(34,197,94,.25);
  `;

  const btnContact = document.createElement("button");
  btnContact.textContent = "Contactar soporte";
  btnContact.style.cssText = `
    background: transparent; border: 1px solid rgba(148,163,184,.35);
    color: #e5e7eb; font-weight: 600; padding: 10px 14px;
    border-radius: 12px; cursor: pointer;
  `;

  const btnCerrar = document.createElement("button");
  btnCerrar.textContent = "Cerrar";
  btnCerrar.style.cssText = `background: transparent; border: none; color: #94a3b8; padding: 10px; cursor: pointer; margin-left:auto;`;

  footer.appendChild(btnCerrar);
  footer.appendChild(btnContact);
  footer.appendChild(btnPlanes);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    modal.style.transform = "translateY(0)";
    modal.style.opacity = "1";
  });

  const close = () => {
    modal.style.transform = "translateY(12px)";
    modal.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
      unblur();
      window.location.replace("index.html#planes");
    }, 200);
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  btnCerrar.addEventListener("click", close);
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", esc);
      close();
    }
  });

  btnPlanes.addEventListener("click", () => {
    if (typeof onUpgrade === "function") onUpgrade();
    else window.location.href = "index.html#planes";
  });
  btnContact.addEventListener("click", () => {
    if (typeof onContact === "function") onContact();
    else
      window.open(
        "https://www.instagram.com/myassistant.ai/",
        "_blank"
      );
  });
}

let planUsuario = "free";
let paginaActual = 1;
let modoLista = "manual";
const productosPorPagina = 4;

let currentUser = null;
let productos = [];
let infoExtra = "";
let respuestasUsadas = 0;
let chatHistory = JSON.parse(sessionStorage.getItem("chatHistory") || "[]");

// ====== Firebase ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
  increment,
  collection,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbthu8tK0xOzHHAZSQKWzXdHKsgA_8bBk",
  authDomain: "asistente-emprendedores-a998d.firebaseapp.com",
  projectId: "asistente-emprendedores-a998d",
  storageBucket: "asistente-emprendedores-a998d.appspot.com",
  messagingSenderId: "964853716620",
  appId: "1:964853716620:web:2e2a27fbd631666e82cda9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let iaActiva = true;

const iaToggle     = document.getElementById("ia-toggle");
const iaStatusText = document.getElementById("ia-status-text");
const iaDot        = document.getElementById("ia-dot");
const iaPing       = document.getElementById("ia-ping");

function actualizarUIIA() {
  if (iaToggle) iaToggle.checked = iaActiva;

  if (iaStatusText) {
    iaStatusText.textContent = iaActiva ? "IA activa" : "IA desactivada";
  }

  if (iaActiva) {
    document.body.classList.remove("ia-off");
  } else {
    document.body.classList.add("ia-off");
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  let data = {};
  if (snap.exists()) {
    data = snap.data();
    iaActiva = data.iaActiva ?? true;
  } else {
    iaActiva = true;
  }

  // ✅ PLAN REAL (incluye trial → experto)
  planUsuario = effectivePlanFromData(data.plan, data);

  // ✅ MOSTRAR / OCULTAR Reservas y Pedidos
  aplicarSoloExperto(planUsuario);

  actualizarUIIA();

  // 🚫 Seguridad extra: no inicializar reservas si no es experto
  if (planUsuario === "experto") {
    initReservasUI(user.uid);
    wireReservaLinkUI(user.uid);
  }
});


if (iaToggle) {
  iaToggle.addEventListener("change", async () => {
    const user = auth.currentUser;
    if (!user) return;

    iaActiva = iaToggle.checked;
    console.log("[IA] toggle cambiado, iaActiva =", iaActiva);

    try {
      await updateDoc(doc(db, "usuarios", user.uid), { iaActiva });
    } catch (e) {
      console.error("Error guardando estado de IA:", e);
    }

    actualizarUIIA();
  });
}



// 👉 Exponer para otros scripts embebidos
window.db = db;
window.doc = doc;
window.getDoc = getDoc;
window.currentUser = null;

// ====== Refs DOM ======
const btnMiPlan = document.getElementById("btnMiPlan");
const planPanel = document.getElementById("plan-panel");
const linkOCR = document.getElementById("link-ocr");
const planEmailEl = document.getElementById("plan-email");
const planTipoEl = document.getElementById("plan-tipo");
const planUsadasEl = document.getElementById("plan-usadas");
const lista = document.getElementById("lista");
const formProducto = document.getElementById("producto-form");
const nombreIn = document.getElementById("nombre");
const precioIn = document.getElementById("precio");
const detalleIn = document.getElementById("talles"); 
const imgIn = document.getElementById("imagen") || { files: [] };
const linkIn = document.getElementById("linkProducto"); // ✅
const variantTipoIn = document.getElementById("variantTipo");
const variantNombreCustomIn = document.getElementById("variantNombreCustom");
const variantListEl = document.getElementById("variantList");


const btnAgregarCampo = document.getElementById("btn-agregar-campo");
const fieldsContainer = document.getElementById("fields-container");

const chatToggle = document.getElementById("chat-toggle");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

const infoForm = document.getElementById("info-form");
const infoInput = document.getElementById("info");
const infoDiv = document.querySelector("#info-usuario > div");
const toggleInfoBtn = document.getElementById("toggleInfoBtn");

const menuBtn = document.getElementById("menuBtn");
const menuOpciones = document.getElementById("menuOpciones");
const logoutBtn = document.getElementById("logoutBtn");

const ocrForm = document.getElementById("ocr-form");
const ocrImagen = document.getElementById("ocr-imagen");
const ocrResultado = document.getElementById("ocr-resultado");
const ocrSectionPanel = document.getElementById("ocr-section");

const inputBuscador = document.getElementById("buscador-productos");
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

// Campos negocio/tienda
const negocioForm = document.getElementById("negocio-form");
const descripcionNegocio = document.getElementById("descripcionNegocio");
const estadoNegocio = document.getElementById("estadoNegocio");
const inputTienda = document.getElementById("linkTienda");

// Mensajes auto (experto/pro)
const formMensajeAuto = document.getElementById("form-mensaje-auto");
const importarWeb = document.getElementById("importar-web");
const importarUpsell = document.getElementById("importar-upsell");
const linkMensajeAuto = document.getElementById("link-mensaje-auto");

// KPIs
const kpiProductosEl = document.getElementById("kpi-productos");
const kpiReservasEl = document.getElementById("kpi-reservas");
const kpiIAEl = document.getElementById("kpi-ia");

function mostrarEstadoTienda(link) {
  const el = document.getElementById("estado-tienda");
  if (el) el.textContent = link ? "✅ Link de tienda cargado" : "— sin link —";
}
function mostrarCartelLimiteSuperado() {
  alert("Alcanzaste el límite de respuestas del plan Básico.");
}

function setPageIndicator(totalPaginas) {
  let indicador = document.getElementById("pageIndicator");
  if (!indicador) {
    indicador = document.createElement("div");
    indicador.id = "pageIndicator";
    indicador.style.textAlign = "center";
    indicador.style.color = "#aaa";
    indicador.style.marginTop = "10px";
    lista?.parentElement?.appendChild(indicador);
  }
  indicador.textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;
}

function encodeAttrs(attrs) {
  try {
    return encodeURIComponent(JSON.stringify(attrs || {}));
  } catch {
    return encodeURIComponent("{}");
  }
}
function decodeAttrs(s) {
  try {
    return JSON.parse(decodeURIComponent(String(s || "%7B%7D")));
  } catch {
    return {};
  }
}

function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return "https://" + s;
  return "https://" + s;
}

// ====== KPIs ======
async function actualizarKpiProductos() {
  try {
    let total = Array.isArray(productos) ? productos.length : 0; // manual

    if (currentUser) {
      // OCR (categorías)
      const snap = await getDoc(doc(db, "usuarios", currentUser.uid));
      const data = snap.data() || {};
      const categorias = data.categorias || {};
      total += Object.values(categorias).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      );

      // IA (subcolección 'productos' con origen ia-*)
      const iaCol = await getDocs(
        collection(db, "usuarios", currentUser.uid, "productos")
      );
      total += iaCol.docs.filter((d) =>
        String(d.data()?.origen || "").startsWith("ia-")
      ).length;
    }

    if (kpiProductosEl) kpiProductosEl.textContent = String(total);
  } catch (e) {
    console.warn("No se pudo actualizar KPI Productos:", e);
  }
}

function actualizarKpiIA(usadas) {
  if (kpiIAEl) kpiIAEl.textContent = String(usadas ?? 0);
}

// ====== RESERVAS (MVP) ======

// Construye el link público para que los clientes reserven
function getReservaLink(uidNegocio = auth?.currentUser?.uid || "") {
  const base = window.location.origin; // usa el mismo dominio del panel
  return `${base}/reservas.html?negocio=${encodeURIComponent(uidNegocio)}`;
}

// Render simple de tarjeta de reserva
function renderReservaCardSnap(docSnap) {
  const d = docSnap.data() || {};
  const el = document.createElement("div");
  el.style.cssText =
    "border:1px solid #1e335a;border-radius:12px;padding:12px;background:#0c1a30;display:grid;gap:6px";
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <strong>${d.servicio || "Servicio"}</strong>
      <span style="font-size:12px;opacity:.8">${d.estado || "pendiente"}</span>
    </div>
    <div style="font-size:14px;opacity:.9">${d.fecha || "—"} · ${
    d.hora || "—"
  }</div>
    <div style="font-size:14px">👤 ${d.nombreCliente || "—"} · 📞 ${
    d.telefono || "—"
  }</div>
  `;
  return el;
}

function ensureReservaBell() {
  const host = kpiReservasEl?.parentElement;
  if (!host) return null;

  let el = document.getElementById("reserva-bell");
  if (el) return el;

  el = document.createElement("span");
  el.id = "reserva-bell";
  el.style.cssText =
    "margin-left:8px;display:none;align-items:center;gap:6px;cursor:pointer;user-select:none;";
  el.innerHTML =
    '<span style="font-size:16px;line-height:1">🔔</span>' +
    '<span class="badge" style="background:#ef4444;color:#fff;border-radius:999px;padding:1px 6px;font-weight:700;font-size:12px">0</span>';
  host.appendChild(el);

  el.addEventListener("click", () => {
    hideReservaBell();
    const uid = auth?.currentUser?.uid;
    if (uid) localStorage.setItem(`reservas_last_seen_${uid}`, String(Date.now()));
  });

  return el;
}

function showReservaBell(n) {
  const el = ensureReservaBell();
  if (!el) return;
  el.querySelector(".badge").textContent = String(n);
  el.style.display = "inline-flex";
  el.animate(
    [
      { transform: "scale(0.9)" },
      { transform: "scale(1.08)" },
      { transform: "scale(1)" },
    ],
    { duration: 280 }
  );
}

function hideReservaBell() {
  const el = document.getElementById("reserva-bell");
  if (el) el.style.display = "none";
}

function initReservasUI(uid) {
  const cont = document.getElementById("reservas-list");
  if (!uid) return;

  const lastSeenKey = `reservas_last_seen_${uid}`;
  let lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
  let firstLoad = true; // no notificar en el primer render

  const colRef = collection(db, "usuarios", uid, "reservas");
  const tryByFecha = query(colRef, orderBy("fecha", "asc"));

  let unsub = onSnapshot(
    tryByFecha,
    (snap) => {
      // === Notificaciones 🔔
      // contamos solo "added" posteriores a lastSeen (y no en primer load)
      let nuevos = 0;
      const changes = snap.docChanges();
      for (const ch of changes) {
        if (ch.type !== "added") continue;
        const d = ch.doc.data() || {};
        const created =
          d.createdAt?.toMillis?.() ??
          (d.createdAt ? new Date(d.createdAt).getTime() : Date.now());
        if (!firstLoad && created > lastSeen) nuevos++;
      }
      if (nuevos > 0) showReservaBell(nuevos);

      // === Render UI listado + KPI
      if (cont) cont.innerHTML = "";
      if (snap.empty) {
        if (cont)
          cont.innerHTML = `<div style="opacity:.75">Aún no hay reservas.</div>`;
        if (kpiReservasEl) kpiReservasEl.textContent = "0";
      } else {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ahora = new Date();
        const activas = docs.filter((r) => {
          const f = r.fecha?.toDate
            ? r.fecha.toDate()
            : r.fecha
            ? new Date(r.fecha)
            : null;
          const esFutura = f
            ? f >= new Date(ahora.getTime() - 5 * 60 * 1000)
            : true;
          return esFutura && (r.estado || "pendiente") !== "cancelada";
        }).length;

        if (kpiReservasEl) kpiReservasEl.textContent = String(activas);
        if (cont) docs.forEach((d) => cont.appendChild(renderReservaCardData(d)));
      }

      // primera pasada: marcamos como visto desde "ahora" para no spamear
      if (firstLoad) {
        firstLoad = false;
        lastSeen = Date.now();
        localStorage.setItem(lastSeenKey, String(lastSeen));
      }
    },
    (err) => {
      console.warn("orderBy(fecha) falló, pruebo createdAt:", err?.message || err);
      unsub && unsub();
      const qref = query(colRef, orderBy("createdAt", "desc"));
      onSnapshot(qref, (snap) => {
        // Reutilizamos misma lógica con cambios
        let nuevos = 0;
        const changes = snap.docChanges();
        for (const ch of changes) {
          if (ch.type !== "added") continue;
          const d = ch.doc.data() || {};
          const created =
            d.createdAt?.toMillis?.() ??
            (d.createdAt ? new Date(d.createdAt).getTime() : Date.now());
          if (!firstLoad && created > lastSeen) nuevos++;
        }
        if (nuevos > 0) showReservaBell(nuevos);

        if (cont) cont.innerHTML = "";
        if (snap.empty) {
          if (cont)
            cont.innerHTML = `<div style="opacity:.75">Aún no hay reservas.</div>`;
          if (kpiReservasEl) kpiReservasEl.textContent = "0";
          return;
        }
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (kpiReservasEl) {
          const activas = docs.filter(
            (r) => (r.estado || "pendiente") !== "cancelada"
          ).length;
          kpiReservasEl.textContent = String(activas);
        }
        if (cont) docs.forEach((d) => cont.appendChild(renderReservaCardData(d)));

        if (firstLoad) {
          firstLoad = false;
          lastSeen = Date.now();
          localStorage.setItem(lastSeenKey, String(lastSeen));
        }
      });
    }
  );
}

// Render desde objeto (parecido a tu renderReservaCardSnap)
function renderReservaCardData(d) {
  const el = document.createElement("div");
  el.style.cssText =
    "border:1px solid #1e335a;border-radius:12px;padding:12px;background:#0c1a30;display:grid;gap:6px";

  // fecha/hora amigables
  let fechaStr = "—";
  if (d.fecha?.toDate) {
    const f = d.fecha.toDate();
    fechaStr = f.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } else if (d.fecha) {
    try {
      const f = new Date(d.fecha);
      fechaStr = f.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {}
  }

  const estado = (d.estado || "pendiente").toLowerCase();

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <strong>${d.servicio || d.motivo || "Reserva"}</strong>
      <span style="font-size:12px;opacity:.85;text-transform:capitalize">${estado}</span>
    </div>
    <div style="font-size:14px;opacity:.9">${fechaStr}${
    d.lugar ? ` · ${d.lugar}` : ""
  }</div>
    <div style="font-size:14px">
      👤 ${d.nombreCliente || d.cliente || "—"}
      ${d.telefono ? ` · 📞 ${d.telefono}` : ""}
    </div>
    ${d.nota ? `<div style="font-size:13px;opacity:.85">${d.nota}</div>` : ""}
    <div style="display:flex;gap:8px;margin-top:6px">
      <button data-id="${
        d.id
      }" data-accion="confirmar" class="px-3 py-1.5 text-sm rounded-lg border border-slate-700 hover:bg-slate-800" style="background:#0b2545;color:#e5e7eb;border:1px solid #1e335a">Confirmar</button>
      <button data-id="${
        d.id
      }" data-accion="cancelar" class="px-3 py-1.5 text-sm rounded-lg border border-slate-700 hover:bg-slate-800" style="background:#0b2545;color:#e5e7eb;border:1px solid #1e335a">Cancelar</button>
      <button data-id="${
        d.id
      }" data-accion="eliminar" class="px-3 py-1.5 text-sm rounded-lg" style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.35)">Eliminar</button>
    </div>
  `;
  return el;
}

// Acciones en tarjetas de reservas (confirmar / cancelar / eliminar)
document
  .getElementById("reservas-list")
  ?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const accion = btn.getAttribute("data-accion");
    const uid = auth?.currentUser?.uid;
    if (!uid || !id) return;

    const ref = doc(db, "usuarios", uid, "reservas", id);
    try {
      if (accion === "confirmar") await updateDoc(ref, { estado: "confirmada" });
      if (accion === "cancelar") await updateDoc(ref, { estado: "cancelada" });
      if (accion === "eliminar") await deleteDoc(ref);
    } catch (err) {
      console.error("Reserva acción error:", err);
      alert("No se pudo actualizar la reserva.");
    }
  });

// (Opcional) Mostrar/pegar el link dentro del panel si agregás estos elementos:
//  - un input readonly con id="linkReservaInput"
//  - un botón con id="btnCopiarLinkReserva"
function wireReservaLinkUI(uid) {
  const input = document.getElementById("linkReservaInput");
  const btn = document.getElementById("btnCopiarLinkReserva");
  if (!input && !btn) return;

  const link = getReservaLink(uid);
  if (input) {
    input.value = link;
    input.readOnly = true;
  }
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        btn.textContent = "✅ Copiado";
        setTimeout(() => (btn.textContent = "Copiar"), 1500);
      } catch {
        alert("No se pudo copiar. Copiá manualmente: " + link);
      }
    });
  }
}

async function saveCategorias(categorias) {
  const refUsuario = doc(db, "usuarios", currentUser.uid);
  await setDoc(refUsuario, { categorias }, { merge: true });
}

async function deleteProducto(carpeta, idx) {
  if (!currentUser) return;
  const snap = await getDoc(doc(db, "usuarios", currentUser.uid));
  const cat = snap.data()?.categorias || {};
  if (!Array.isArray(cat[carpeta])) return;
  cat[carpeta].splice(idx, 1);
  await saveCategorias(cat);
  renderCategoriasOCR();
}
window.deleteProducto = deleteProducto;

async function updateProducto(carpeta, idx, nuevo) {
  if (!currentUser) return;
  const snap = await getDoc(doc(db, "usuarios", currentUser.uid));
  const cat = snap.data()?.categorias || {};
  if (!Array.isArray(cat[carpeta])) return;

  // ✅ MERGE: conserva attrs/caracteristicas/etc. y solo actualiza lo que mandes
  const original = cat[carpeta][idx] || {};
  cat[carpeta][idx] = { ...original, ...nuevo };

  await saveCategorias(cat);
}

async function authHeaderSiGuarda(guardar) {
  if (!guardar) return {};
  const user = auth.currentUser;
  if (!user) throw new Error("Necesitás iniciar sesión para guardar.");
  const token = await user.getIdToken(true);
  return { Authorization: "Bearer " + token };
}
async function authHeader() {
  const user = auth.currentUser;
  if (!user) throw new Error("Necesitás iniciar sesión.");
  const token = await user.getIdToken(true);
  return { Authorization: "Bearer " + token };
}

// ====== App UI ======
if (btnAgregarCampo && fieldsContainer && !window.__agregarCampoInit) {
  // evita doble binding si el script se carga dos veces
  window.__agregarCampoInit = true;

  // Apilar filas en columna
  fieldsContainer.classList.remove("space-y-4");
  Object.assign(fieldsContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
  });

  // Debounce anti doble-click
  let adding = false;

  btnAgregarCampo.setAttribute("type", "button");
  btnAgregarCampo.addEventListener("click", (e) => {
    e.preventDefault();
    if (adding) return;
    adding = true;
    setTimeout(() => (adding = false), 60);

    const row = document.createElement("div");
    row.className = "campo-extra";
    Object.assign(row.style, {
      display: "flex",
      flexDirection: "column", // <- VERTICAL
      gap: "8px",
      width: "100%",
    });

    row.innerHTML = `
      <input type="text" class="input extra-key" placeholder="Clave (ej. material)" style="width:100%">
      <input type="text" class="input extra-value" placeholder="Valor (ej. cuero)" style="width:100%">
      <button type="button" class="btn-del" title="Eliminar"
        style="align-self:flex-start;padding:.55rem .75rem;border-radius:.5rem;background:rgba(239,68,68,.15);color:#f87171;border:none;cursor:pointer;">✕</button>
    `;

    row.querySelector(".btn-del").onclick = () => row.remove();
    fieldsContainer.appendChild(row);
  });
}

if (infoForm) {
  infoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("⚠️ No hay usuario logueado");
    const info = (infoInput?.value || "").trim();
    if (!info) return alert("Por favor ingresá información válida.");
    try {
      await setDoc(
        doc(db, "usuarios", currentUser.uid),
        { info },
        { merge: true }
      );
      alert("Información guardada correctamente");
    } catch (error) {
      console.error("Error guardando info extra:", error);
      alert("Error al guardar la información.");
    }
  });
}

if (menuBtn && menuOpciones) {
  menuBtn.addEventListener("click", () => {
    menuOpciones.style.display =
      menuOpciones.style.display === "block" ? "none" : "block";
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
if (toggleInfoBtn) {
  toggleInfoBtn.addEventListener("click", () => {
    const cont = document.getElementById("info-usuario");
    if (cont)
      cont.style.display = cont.style.display === "block" ? "none" : "block";
  });
}

// ====== Chat ======
const msg = (texto, tipo) => {
  const div = document.createElement("div");
  div.className = `message ${tipo}`;
  div.textContent = texto;
  chatMessages?.appendChild(div);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
};
const replaceLastBot = (texto) => {
  if (!chatMessages) return;
  const bots = chatMessages.querySelectorAll(".message.bot");
  if (bots.length) bots[bots.length - 1].textContent = texto;
};

// ========= Helpers catálogo =========
function normalizarDetallesToArray(val) {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (!val) return [];
  return String(val)
    .split(/[\n\r]+|[•·]|[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAttrsFromDetalles(detallesArr) {
  const attrs = {};
  for (const raw of detallesArr) {
    const m = raw.match(/^\s*([^:–—\-]+?)\s*[:\-–—]\s*(.+)$/);
    if (m) {
      attrs[m[1].trim().toLowerCase()] = m[2].trim();
      continue;
    }
    const m2 = raw.match(
      /^\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s\.#\+\-]{1,24})\s+(.{1,60})$/
    );
    if (m2) {
      attrs[m2[1].trim().toLowerCase()] = m2[2].trim();
    }
  }
  return attrs;
}

function toArrayDetalles(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  return String(val)
    .split(/[\n\r]+|[•·]|[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function armarCatalogo(items = []) {
  return items.map((p) => {
    // Unificamos todas las posibles fuentes de detalles
    const detallesArr = [
      ...toArrayDetalles(p.talles),
      ...toArrayDetalles(p.caracteristicas),
      ...toArrayDetalles(p.detalles),
      ...toArrayDetalles(p.descripcion || p.description),
    ];

    // Extras “inmobiliarios” (si existen)
    const extras = [];
    if (p.ubicacion) extras.push(`Ubicación: ${p.ubicacion}`);
    if (p.habitaciones) extras.push(`Habitaciones: ${p.habitaciones}`);
    if (p.banos) extras.push(`Baños: ${p.banos}`);
    if (p.extra) extras.push(`Extra: ${p.extra}`);

    const url = normalizeUrl(
      p.url ||
        p.origenUrl ||
        p.urlProducto ||
        p.link ||
        p.linkProducto ||
        p.enlace ||
        p.website ||
        p.site ||
        p.href ||
        ""
    );

    // A los detalles también les agregamos attrs como "clave: valor"
    const objAttrs =
      p && typeof p.attrs === "object" && !Array.isArray(p.attrs) ? p.attrs : {};
    const dets = [...detallesArr, ...extras];
    for (const [k, v] of Object.entries(objAttrs)) {
      if (k && v != null && String(v).trim() !== "") dets.push(`${k}: ${v}`);
    }
    if (url) dets.push(`URL: ${url}`);

    // attrs finales: normalizamos claves y mezclamos con lo que podamos parsear
    const parsed = parseAttrsFromDetalles(dets);
    const lowerObj = Object.fromEntries(
      Object.entries(objAttrs).map(([k, v]) => [
        String(k).toLowerCase(),
        String(v),
      ])
    );
    const attrsFinal = { ...lowerObj, ...parsed };

    return {
      id: p.id || null,
      nombre: p.nombre || "Producto",
      precio: p.precio ?? "",
      detalles: dets,
      attrs: attrsFinal,
      url,
    };
  });
}

// ===== Helpers chat =====
if (chatToggle && chatBox) {
  chatToggle.addEventListener("click", () => {
    chatBox.classList.toggle("hidden");
    if (!chatBox.classList.contains("hidden")) {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput?.focus();
    }
  });
}

if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (planUsuario === "basico" && respuestasUsadas >= 230) {
      msg("🧠 " + chatInput.value.trim(), "user");
      chatHistory.push({ role: "user", content: chatInput.value.trim() });
      chatInput.value = "";
      mostrarCartelLimiteSuperado();
      return;
    }

    const mensaje = chatInput.value.trim();
    if (!mensaje) return;

    // 🛑 Si la IA está desactivada, mostramos el mensaje del usuario y avisamos
    if (!iaActiva) {
      msg("🧠 " + mensaje, "user");
      chatHistory.push({ role: "user", content: mensaje });
      chatInput.value = "";
      msg("🤖 La IA está desactivada. Activala para seguir chateando.", "bot");
      return;
    }

    // ✅ IA activa: flujo normal
    msg("🧠 " + mensaje, "user");
    chatHistory.push({ role: "user", content: mensaje });
    if (chatHistory.length > 10) chatHistory.shift();
    chatInput.value = "";

    await responderIA(mensaje);
  });
}

// --- Guardrail ---
function sanearRespuesta(texto) {
  const ban =
    /(domicilio|direcci[oó]n|tarjeta|cvv|pago|link\s*de\s*pago|mercado\s*pago|transferencia|env[ií]o|retiro|retirar)/i;
  const pedir =
    /(pasame|enviame|dej(a|e)|indicame|decime|compart(i|í)|ingres[aá]|mandame|proporcion[aá]|facilit[a|e])/i;
  if (ban.test(texto) && pedir.test(texto)) {
    return "Por ahora no realizo compras, envíos ni reservas/turnos, y no solicito domicilio ni datos de pago. Puedo ayudarte con info de productos, stock, variantes y promos; o si querés te derivo a un vendedor.";
  }
  return texto;
}

function normalizarDia(d) {
  if (!d) return "";
  const s = String(d).trim().toLowerCase();
  if (s.startsWith("lun") || s.startsWith("mon")) return "lun";
  if (s.startsWith("mar") || s.startsWith("tue")) return "mar";
  if (s.startsWith("mié") || s.startsWith("mie") || s.startsWith("wed"))
    return "mie";
  if (s.startsWith("jue") || s.startsWith("thu")) return "jue";
  if (s.startsWith("vie") || s.startsWith("fri")) return "vie";
  if (s.startsWith("sáb") || s.startsWith("sab") || s.startsWith("sat"))
    return "sab";
  if (s.startsWith("dom") || s.startsWith("sun")) return "dom";
  return s.slice(0, 3);
}
function diaHoy() {
  const ov = localStorage.getItem("DEBUG_DIA");
  if (ov) return ov;
  return ["dom", "lun", "mar", "mie", "jue", "vie", "sab"][new Date().getDay()];
}
function extractHashtags(msg) {
  return (msg.match(/#([\p{L}\d_]+)/gu) || []).map((s) =>
    s.slice(1).toLowerCase()
  );
}
function matchKeywords(pregunta, keywords, fallbackMensaje) {
  const q = (pregunta || "").toLowerCase();
  let ks = Array.isArray(keywords) ? keywords : [];
  if (!ks.length && fallbackMensaje) ks = extractHashtags(fallbackMensaje);
  return ks.length ? ks.some((k) => k && q.includes(k)) : true;
}
function promoRelevantePara(pregunta, cfg) {
  if (!cfg) return null;
  const hoy = diaHoy();
  const diasOk = (cfg.dias || []).map(normalizarDia);
  if (!diasOk.includes(hoy)) return null;
  if (!matchKeywords(pregunta, cfg.keywords, cfg.mensaje)) return null;
  return cfg.mensaje;
}

async function fetchMensajesProgramados() {
  const uid = auth?.currentUser?.uid;
  if (!uid) return [];

  const candidatos = [
    collection(db, "usuarios", uid, "mensajes"),
    collection(db, "usuarios", uid, "mensajesProgramados"),
  ];

  const todos = [];
  for (const colRef of candidatos) {
    try {
      const snap = await getDocs(colRef);
      snap.forEach((d) => {
        const r = d.data() || {};
        const diasArrRaw = Array.isArray(r.dias)
          ? r.dias
          : Array.isArray(r.diasSemana)
          ? r.diasSemana
          : r.dia
          ? [r.dia]
          : [];
        const keywordsNorm = Array.isArray(r.keywords)
          ? r.keywords
          : r.keywords
          ? String(r.keywords)
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean)
          : [];
        todos.push({
          id: d.id,
          mensaje: r.mensaje || r.texto || "",
          hora: r.hora || r.horario || null,
          dias: diasArrRaw.map(normalizarDia),
          keywords: keywordsNorm,
        });
      });
    } catch {}
  }
  return todos;
}

function elegirPromoParaPregunta(pregunta, promos) {
  const hoy = diaHoy();
  const q = (pregunta || "").toLowerCase();

  for (const p of promos) {
    const diasOk = (p.dias || []).map(normalizarDia);
    if (diasOk.length && !diasOk.includes(hoy)) continue;

    let ks = Array.isArray(p.keywords) ? p.keywords : [];
    if (!ks.length) ks = extractHashtags(p.mensaje);
    if (ks.length && !ks.some((k) => k && q.includes(k))) continue;

    return p.mensaje;
  }
  return null;
}

async function responderIA(pregunta) {
  // 🚫 Blindaje extra: si la IA está apagada, no hago NADA
  if (!iaActiva) {
    console.log("[IA] Bloqueada: iaActiva = false, no llamo al backend");
    return;
  }

  msg("⏳ Pensando...", "bot");

  try {
    if (!currentUser) throw new Error("No hay usuario logueado");

    const snapUsuario = await getDoc(doc(db, "usuarios", currentUser.uid));
    const dataUsuario = snapUsuario.data() || {};

    // Productos de todas las fuentes (manual + OCR + IA web)
    let productosOCR = [];
    const categorias = dataUsuario.categorias || {};
    for (const carpeta in categorias)
      productosOCR = productosOCR.concat(categorias[carpeta]);

    let productosIA = [];
    try {
      productosIA = await fetchProductosIAWeb();
    } catch {}

    const todosLosProductos = [
      ...(dataUsuario.productos || []),
      ...productosOCR,
      ...productosIA,
    ].slice(0, 50);

    const catalogo = armarCatalogo(todosLosProductos);

    let disponibilidadInfo = "";
    if (dataUsuario.disponibilidad) {
      const { dias, horario } = dataUsuario.disponibilidad;
      disponibilidadInfo = `Horarios: ${dias.join(", ")} de ${horario}`;
    }
    const infoNegocio = dataUsuario.infoNegocio || "";

    const promos = [];
    if (dataUsuario.mensajeProgramado) {
      promos.push({
        mensaje: dataUsuario.mensajeProgramado.mensaje,
        hora: dataUsuario.mensajeProgramado.hora,
        dias: (dataUsuario.mensajeProgramado.dias || []).map(normalizarDia),
        keywords: dataUsuario.mensajeProgramado.keywords || [],
      });
    }
    try {
      promos.push(...(await fetchMensajesProgramados()));
    } catch {}
    const promoActivaParaPregunta = elegirPromoParaPregunta(pregunta, promos);

    // 🔗 FAST PATH link
    const pideLink = /\b(link|enlace|url)\b/i.test(pregunta);
    if (pideLink) {
      const conUrl = catalogo.filter((p) => p.url);
      let elegido = null;

      if (conUrl.length === 1) {
        elegido = conUrl[0];
      } else {
        const q = (pregunta || "").toLowerCase();
        const porNombre = conUrl.filter(
          (p) => p.nombre && q.includes(String(p.nombre).toLowerCase())
        );
        if (porNombre.length === 1) elegido = porNombre[0];
      }

      if (elegido) {
        let respuesta = `Acá está el link de "${elegido.nombre}": ${elegido.url}`;
        if (promoActivaParaPregunta) {
          respuesta += `\n\n💡 Promo de hoy: ${promoActivaParaPregunta}`;
        }
        replaceLastBot(sanearRespuesta(respuesta));
        chatHistory.push({ role: "assistant", content: respuesta });
        sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        try {
          await setDoc(
            doc(db, "usuarios", currentUser.uid),
            { respuestasUsadas: increment(1) },
            { merge: true }
          );
          respuestasUsadas += 1;
          renderInfo({ plan: planUsuario, respuestasUsadas });
        } catch {}
        return; // ✅ no llamamos a la IA
      }
    }

    const reglasAsistente = `
Eres un asistente de tienda. Usa EXCLUSIVAMENTE CATALOGO_JSON.
REGLAS:
- Si el cliente pide un dato (precio, color, talle, material, marca, año, kilómetros, medidas, etc.), respóndelo **exactamente** como en el catálogo (texto literal).
- Si piden el link, usa el campo "url" o el detalle literal que empieza con "URL: ".
- Si el dato NO está en el catálogo, responde: "No tengo ese dato".
- No inventes ni infieras.
- Si la pregunta es ambigua (varios productos posibles), pide que especifique.
- Responde breve y amable. Incluye la URL del producto si existe.
`;

    const contexto = `
CATALOGO_JSON = ${JSON.stringify(catalogo, null, 2)}
INFO_NEGOCIO = ${JSON.stringify(infoNegocio || "No hay")}
DISPONIBILIDAD = ${JSON.stringify(disponibilidadInfo || "No hay")}
${
  promoActivaParaPregunta
    ? `PROMO_HOY = ${JSON.stringify(promoActivaParaPregunta)}`
    : ""
}`.trim();

    const historyPrompt = chatHistory
      .slice(-5)
      .map((m) => (m.role === "user" ? "Cliente: " : "Asistente: ") + m.content)
      .join("\n");

    const prompt = `
${reglasAsistente}

Contexto:
${contexto}

Conversación previa (si ayuda a identificar el producto):
${historyPrompt}

Cliente: "${pregunta}"

Instrucciones finales:
1) Identifica el producto por nombre o por el contexto reciente. Si no está claro y hay más de uno, pide que especifique.
2) Cualquier atributo (precio, año, km, talle, color, etc.) debe copiarse **literal** del catálogo (attrs/detalles).
3) Si falta, di "No tengo ese dato".
4) Si hay PROMO_HOY relevante, menciónala al final.
`.trim();

    console.log("CATALOGO_JSON_DEBUG", catalogo);

    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: prompt, uid: currentUser?.uid }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Chat ERROR:", res.status, text);
      throw new Error(`HTTP ${res.status} – ${text}`);
    }

    const data = await res.json();
    let respuesta =
      data.respuesta || data.reply || "⚠️ No pude responder ahora.";
    if (promoActivaParaPregunta) {
      const ya = respuesta
        .toLowerCase()
        .includes(
          String(promoActivaParaPregunta).toLowerCase().slice(0, 20)
        );
      if (!ya)
        respuesta += `\n\n💡 Promo de hoy: ${promoActivaParaPregunta}`;
    }

    respuesta = sanearRespuesta(respuesta);

    replaceLastBot(respuesta);

    chatHistory.push({ role: "assistant", content: respuesta });
    sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));

    await setDoc(
      doc(db, "usuarios", currentUser.uid),
      { respuestasUsadas: increment(1) },
      { merge: true }
    );
    respuestasUsadas += 1;
    renderInfo({ plan: planUsuario, respuestasUsadas });
  } catch (err) {
    console.error("❌ Error al responder:", err);
    replaceLastBot(
      "❌ Error al conectar con la IA. Intenta de nuevo en unos segundos."
    );
  }
}


function renderInfo(data) {
  const plan = (data.plan || "free").toUpperCase();
  const usadas = data.respuestasUsadas || 0;
  const limite = plan === "BASICO" ? "230" : "∞";

  if (infoDiv) {
    infoDiv.innerHTML = `<h3>📝 Plan: ${plan}</h3><p>💬 Respuestas usadas este mes: <strong>${usadas}</strong> / ${limite}</p>`;
  }
  actualizarKpiIA(usadas); // <-- actualiza KPI
}

// ====== Productos (manual) ======
async function imgUrl(path) {
  if (!path) return "";
  try {
    return await getDownloadURL(ref(storage, path));
  } catch {
    return "";
  }
}

async function renderProductos() {
  if (!lista) return;
  lista.innerHTML = "";

  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productos.slice(inicio, fin);

  for (let i = 0; i < productosPagina.length; i++) {
    const p = productosPagina[i];
    const realIndex = inicio + i;

    let detallesHTML = "";

const detalleVal =
  p.detalle ??
  p.descripcion ??
  (Array.isArray(p.talles) ? p.talles.join("\n") : p.talles) ??
  "";

if (detalleVal) {
  const detalles = String(detalleVal)
    .split(/[\n\r]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  detallesHTML = detalles
    .map(d => `<div class="detalles"><i class="fas fa-info-circle"></i> ${d}</div>`)
    .join("");
}

    let extrasAttrsHTML = "";
    if (p.attrs && typeof p.attrs === "object" && !Array.isArray(p.attrs)) {
      extrasAttrsHTML = Object.entries(p.attrs)
        .map(
          ([k, v]) =>
            `<div class="detalles"><i class="fas fa-tag"></i> ${k}: ${v}</div>`
        )
        .join("");
    }

let variantesHTML = "";
if (p.variantes && Array.isArray(p.variantes.opciones) && p.variantes.opciones.length) {
  const nombreVar = (p.variantes.nombre || p.variantes.tipo || "Variante").toString();
  const chips = p.variantes.opciones
    .map((x) => `<span class="chip">${String(x)}</span>`)
    .join("");

  variantesHTML = `
    <div class="chip-label"><i class="fas fa-layer-group"></i> Variantes (${nombreVar}):</div>
    <div class="chips">${chips}</div>
  `;
}


    lista.insertAdjacentHTML(
      "beforeend",
      `
       <div class="card-producto"
           data-id="manual:${realIndex}"
           data-nombre="${p.nombre || ""}"
           data-precio="${p.precio || ""}"
           data-talles="${
             Array.isArray(p.talles) ? p.talles.join(", ") : p.talles || ""
           }"
           data-attrs="${encodeAttrs(p.attrs)}">
        <h4>${p.nombre}</h4>
        <div class="precio">$${p.precio}</div>

        ${
          p.ubicacion
            ? `<div class="detalles"><i class="fas fa-map-marker-alt"></i> ${p.ubicacion}</div>`
            : ""
        }
        ${
          p.habitaciones
            ? `<div class="detalles"><i class="fas fa-bed"></i> ${p.habitaciones} habitaciones</div>`
            : ""
        }
        ${
          p.banos
            ? `<div class="detalles"><i class="fas fa-bath"></i> ${p.banos} baños</div>`
            : ""
        }
        ${
          p.extra
            ? `<div class="detalles"><i class="fas fa-swimming-pool"></i> ${p.extra}</div>`
            : ""
        }
       ${detallesHTML}
${extrasAttrsHTML}
${variantesHTML}
${
          p.origenUrl || p.url
            ? `<div class="detalles"><i class="fas fa-link"></i> <a href="${normalizeUrl(
                p.origenUrl || p.url
              )}" target="_blank" rel="noopener">Ver</a></div>`
            : ""
        }

        <div class="acciones">
          <button class="btn-editar" type="button">
            <i class="fas fa-pen"></i> Editar
          </button>
          <button class="btn-eliminar" onclick="eliminarProducto(${realIndex})">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    `
    );
  }

  if (productosPagina.length < productosPorPagina) {
    const vacios = productosPorPagina - productosPagina.length;
    for (let j = 0; j < vacios; j++) {
      lista.insertAdjacentHTML(
        "beforeend",
        `<div class="card-producto" style="visibility:hidden;"></div>`
      );
    }
  }
  actualizarBotonesPaginacion();
  if (kpiProductosEl) actualizarKpiProductos();
}

function actualizarBotonesPaginacion() {
  const totalPaginas = Math.ceil(productos.length / productosPorPagina) || 1;
  if (btnAnterior) btnAnterior.disabled = paginaActual === 1;
  if (btnSiguiente) btnSiguiente.disabled = paginaActual >= totalPaginas;
  setPageIndicator(totalPaginas);
}

window.eliminarProducto = async (idx) => {
  if (!currentUser) return;
  productos.splice(idx, 1);
  await setDoc(
    doc(db, "usuarios", currentUser.uid),
    { productos },
    { merge: true }
  );
  paginaActual = 1;
  renderProductos();
  await actualizarKpiProductos();
};

if (formProducto) {
  formProducto.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("❌ No hay usuario logueado, refrescá la página.");
      return;
    }

    const nombre = (nombreIn?.value || "").trim();
    const precio = (precioIn?.value || "").trim();
    const link = normalizeUrl(linkIn?.value || ""); // ✅ normalizado

    if (!nombre || !precio) {
      alert("⚠️ Completa nombre y precio.");
      return;
    }

    // 1) Recolectar attrs (filas clave/valor nuevas)
    const extraRows = Array.from(
      document.querySelectorAll(
        "#fields-container .extra-row, #fields-container .campo-extra"
      )
    );
    const attrs = {};
    for (const r of extraRows) {
      const k = r.querySelector(".extra-key")?.value?.trim();
      const v = r.querySelector(".extra-value")?.value?.trim();
      if (k) attrs[k] = v || "";
    }

   const detalle = (detalleIn?.value || "").trim();

const varianteTipo = (variantTipoIn?.value || "").trim();
const varianteNombre =
  varianteTipo === "otro"
    ? (variantNombreCustomIn?.value || "").trim() || "Variante"
    : varianteTipo;

const variantesOpciones = Array.from(
  document.querySelectorAll('[data-variant-item="1"]')
)
  .map((i) => i.value.trim())
  .filter(Boolean);

const variantesData =
  varianteTipo && variantesOpciones.length
    ? { tipo: varianteTipo, nombre: varianteNombre, opciones: variantesOpciones }
    : null;

const nuevoProducto = { nombre, precio, origen: "manual" };
if (Object.keys(attrs).length) nuevoProducto.attrs = attrs;
if (detalle) nuevoProducto.detalle = detalle; 
if (link) {
  nuevoProducto.origenUrl = link;
  nuevoProducto.url = link;
}
if (variantesData) nuevoProducto.variantes = variantesData;


    let subidoUrl = "";
    const archivo = imgIn.files?.[0];
    if (archivo) {
      try {
        const storageRef = ref(
          storage,
          `productos/${currentUser.uid}/${Date.now()}_${archivo.name}`
        );
        await uploadBytes(storageRef, archivo);
        subidoUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("❌ Error subiendo imagen:", err);
        alert("Error al subir la imagen.");
        return;
      }
    }
    if (subidoUrl) nuevoProducto.imgUrl = subidoUrl;

    try {
      const refUser = doc(db, "usuarios", currentUser.uid);
      const snap = await getDoc(refUser);
      const productosActuales = snap.data()?.productos || [];

      await setDoc(
        refUser,
        { productos: [...productosActuales, nuevoProducto] },
        { merge: true }
      );

      const snap2 = await getDoc(refUser);
      productos = snap2.data()?.productos || [];

      nombreIn.value = "";
      precioIn.value = "";
      if (linkIn) linkIn.value = ""; // ✅
      if (imgIn && "value" in imgIn) imgIn.value = "";
     if (detalleIn) detalleIn.value = "";
      formProducto.reset();
      document
        .querySelectorAll(
          "#fields-container .extra-row, #fields-container .extra-field, #fields-container .campo-extra"
        )
        .forEach((n) => n.remove());

if (variantTipoIn) variantTipoIn.value = "";
if (variantNombreCustomIn) variantNombreCustomIn.value = "";
if (variantListEl) variantListEl.innerHTML = "";

      const totalProductos = productos.length;
      paginaActual = Math.ceil(totalProductos / productosPorPagina);
      renderProductos();

      alert("✅ Producto agregado exitosamente!");
      actualizarKpiProductos();
    } catch (err) {
      console.error("❌ Error guardando producto:", err);
      alert("Error al guardar el producto.");
    }
  });
}

if (lista) {
  lista.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-editar");
    if (!btn) return;
    const card = btn.closest(".card-producto");
    if (!card) return;

    const id = card.getAttribute("data-id") || "";
    const nombre = card.getAttribute("data-nombre") || "";
    const precio = card.getAttribute("data-precio") || "";
    const detalle = card.getAttribute("data-detalle") || card.getAttribute("data-talles") || "";
    const link = card.querySelector("a[href]")?.getAttribute("href") || "";
    const attrs = decodeAttrs(card.getAttribute("data-attrs"));

    abrirModalEditar({ id, nombre, precio, detalle, link, attrs, card });
  });
}

let productoEnEdicion = null;

function _escapeAttr(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function _makeExtraRowEditar(k = "", v = "") {
  const row = document.createElement("div");
  row.className = "grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center";

  row.innerHTML = `
    <input type="text" class="input extra-key" placeholder="Clave (ej. color)" value="${_escapeAttr(k)}">
    <input type="text" class="input extra-value" placeholder="Valor (ej. rojo)" value="${_escapeAttr(v)}">
    <button type="button"
      class="h-11 w-11 rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15 font-bold"
      title="Eliminar campo">✕</button>
  `;

  row.querySelector("button")?.addEventListener("click", () => row.remove());
  return row;
}

function abrirModalEditar(prod) {
  productoEnEdicion = prod;

  const form = document.getElementById("formEditar");
  const edNombre = document.getElementById("edNombre");
  const edPrecio = document.getElementById("edPrecio");
  const edMarca = document.getElementById("edMarca");
  const edLink = document.getElementById("edLink");
  const extraContainer = document.getElementById("extraContainer");

  if (!form || !edNombre || !edPrecio || !edMarca || !edLink || !extraContainer) {
    console.warn("❌ No se encontró el modal de edición nuevo en el HTML.");
    return;
  }

  // Cargar valores
  edNombre.value = prod?.nombre || "";
  edPrecio.value = prod?.precio || "";
  edLink.value = prod?.link || "";

  // Si guardás "marca" dentro de attrs
  const attrsBase = { ...(prod?.attrs || {}) };
  edMarca.value = attrsBase.marca || "";

  // No duplicar "marca" en campos extra
  delete attrsBase.marca;

  // Pintar campos extra
  extraContainer.innerHTML = "";
  const entries = Object.entries(attrsBase);
  if (entries.length) {
    entries.forEach(([k, v]) => extraContainer.appendChild(_makeExtraRowEditar(k, v)));
  } else {
    extraContainer.appendChild(_makeExtraRowEditar());
  }

  // Abrir modal visual del HTML
  if (typeof window.abrirModalEditar === "function") {
    window.abrirModalEditar();
  }
}

// Bindings del modal (solo una vez)
(function bindModalEditarNuevo() {
  const form = document.getElementById("formEditar");
  const btnAddCampo = document.getElementById("btnAddCampo");
  const extraContainer = document.getElementById("extraContainer");

  if (!form || form.dataset.boundEditar === "1") return;

  btnAddCampo?.addEventListener("click", () => {
    extraContainer?.appendChild(_makeExtraRowEditar());
  });

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!productoEnEdicion) return;

    const nombre = document.getElementById("edNombre")?.value?.trim() || "";
    const precio = document.getElementById("edPrecio")?.value?.trim() || "";
    const link = normalizeUrl(document.getElementById("edLink")?.value?.trim() || "");
    const marca = document.getElementById("edMarca")?.value?.trim() || "";

    const detalle =
  productoEnEdicion?.detalle ??
  productoEnEdicion?.descripcion ??
  (Array.isArray(productoEnEdicion?.talles)
    ? productoEnEdicion.talles.join("\n")
    : (productoEnEdicion?.talles || ""));

const nuevoAttrs = {};
if (marca) nuevoAttrs.marca = marca;

extraContainer?.querySelectorAll("div").forEach((row) => {
  const k = row.querySelector(".extra-key")?.value?.trim();
  const v = row.querySelector(".extra-value")?.value?.trim();
  if (k) nuevoAttrs[k] = v || "";
});

document.dispatchEvent(
  new CustomEvent("producto-editado", {
    detail: {
      id: productoEnEdicion.id,
      nombre,
      precio,
      detalle, 
      link,
      attrs: nuevoAttrs,
    },
  })
);

    if (productoEnEdicion.card) {
      productoEnEdicion.card.setAttribute("data-attrs", encodeAttrs(nuevoAttrs));
    }

    if (typeof window.cerrarModalEditar === "function") {
      window.cerrarModalEditar();
    }

    productoEnEdicion = null;
  });

  form.dataset.boundEditar = "1";
})();

document.addEventListener("producto-editado", async (ev) => {
  const { id, nombre, precio, detalle, link, attrs } = ev.detail || {};
if (!currentUser || !id) return;

const nuevo = { nombre, precio };

if (detalle) nuevo.detalle = detalle; 

if (link) {
  nuevo.origenUrl = link;
  nuevo.url = link;
}

  try {
    const [src, ...rest] = String(id).split(":");

    if (src === "manual") {
      const idx = parseInt(rest[0], 10);
      if (!Number.isNaN(idx) && productos[idx]) {
        const prevAttrs =
          productos[idx].attrs && typeof productos[idx].attrs === "object"
            ? productos[idx].attrs
            : {};
        if (attrs && Object.keys(attrs).length)
          nuevo.attrs = { ...prevAttrs, ...attrs };
        productos[idx] = { ...productos[idx], ...nuevo };
        await setDoc(
          doc(db, "usuarios", currentUser.uid),
          { productos },
          { merge: true }
        );
        renderProductos();
      }
    } else if (src === "ia") {
      const docId = rest.join(":");
      if (attrs && Object.keys(attrs).length) nuevo.attrs = attrs; // el lado server guarda mergeado
      await updateDoc(
        doc(db, "usuarios", currentUser.uid, "productos", docId),
        nuevo
      );
      if (modoLista === "ia") await cargarProductosIAWeb();
    } else if (src === "ocr") {
      const carpeta = rest[0];
      const idx = parseInt(rest[1], 10);
      if (carpeta && !Number.isNaN(idx)) {
        if (attrs && Object.keys(attrs).length) nuevo.attrs = attrs;
        await updateProducto(carpeta, idx, nuevo);
        await renderCategoriasOCR();
      }
    }
  } catch (e) {
    console.error("❌ Error actualizando producto:", e);
    alert("No se pudo guardar el cambio.");
  }
});
// ====== OCR ======
if (ocrForm) {
  ocrForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("⚠️ No hay usuario logueado");

    const file = ocrImagen?.files?.[0];
    const carpeta =
      (document.getElementById("ocr-carpeta")?.value || "").trim();
    if (!file || !carpeta)
      return alert("Completá la imagen y el nombre del grupo");

    ocrResultado.textContent = "⏳ Enviando imagen a la IA…";

    const formData = new FormData();
    formData.append("imagen", file);

    try {
      const res = await fetch(`${API_BASE}/extraer-productos`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.productos) {
        ocrResultado.textContent = "❌ Error: respuesta inválida de la IA.";
        return;
      }

      const nuevos = JSON.parse(json.productos);
      if (!Array.isArray(nuevos) || nuevos.length === 0) {
        ocrResultado.textContent = "❌ No se detectaron productos válidos.";
        return;
      }

      const refUsuario = doc(db, "usuarios", currentUser.uid);
      const snap = await getDoc(refUsuario);
      const datos = snap.data() || {};
      const categorias = datos.categorias || {};
      categorias[carpeta] = [...(categorias[carpeta] || []), ...nuevos];
      await setDoc(refUsuario, { categorias }, { merge: true });

      ocrResultado.textContent = `✅ ${nuevos.length} productos guardados en “${carpeta}”`;
      renderCategoriasOCR();
    } catch (error) {
      console.error("Error con IA OCR:", error);
      ocrResultado.textContent =
        "❌ Hubo un error al analizar la imagen.";
    }
  });
}

async function renderCategoriasOCR() {
  if (!currentUser) return;
  const refUsuario = doc(db, "usuarios", currentUser.uid);
  const snap = await getDoc(refUsuario);
  const userData = snap.data() || {};
  const categorias = userData.categorias || {};

  const contenedor = document.getElementById("lista-categorias");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  for (const carpeta in categorias) {
    const productos = categorias[carpeta];
    const card = document.createElement("div");
    card.className = "card-carpeta";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const titulo = document.createElement("h4");
    titulo.textContent = carpeta;
    titulo.className = "toggle-carpeta";

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑️";
    btnEliminar.title = "Eliminar carpeta";
    btnEliminar.style.background = "none";
    btnEliminar.style.border = "none";
    btnEliminar.style.color = "red";
    btnEliminar.style.cursor = "pointer";
    btnEliminar.style.fontSize = "18px";

    btnEliminar.addEventListener("click", async () => {
      const ok = confirm(`¿Eliminar carpeta "${carpeta}"?`);
      if (!ok) return;

      card.style.transition =
        "opacity 0.3s ease-out, transform 0.3s ease-out";
      card.style.opacity = "0";
      card.style.transform = "scale(0.95)";

      setTimeout(async () => {
        const refUsuario = doc(db, "usuarios", currentUser.uid);
        await updateDoc(refUsuario, {
          [`categorias.${carpeta}`]: deleteField(),
        });
        renderCategoriasOCR();
      }, 300);
    });

    header.appendChild(titulo);
    header.appendChild(btnEliminar);
    card.appendChild(header);

    const listaC = document.createElement("div");
    listaC.className = "productos-carpeta";
    listaC.style.display = "none";

    productos.forEach((p, idx) => {
      const cont = document.createElement("div");
      cont.className = "producto-carpeta";
      cont.innerHTML = `
  <input value="${p.nombre || ""}" style="width: 30%; margin-right: 10px;">
  <input value="${p.precio || ""}" style="width: 20%; margin-right: 10px;">
  <button class="btn-guardar">💾</button>
  <button class="btn-borrar">🗑️</button>
`;

      const [inputNombre, inputPrecio, btnGuardar, btnBorrar] =
        cont.querySelectorAll("input, button");

      btnGuardar.onclick = () => {
        updateProducto(carpeta, idx, {
          nombre: inputNombre.value.trim(),
          precio: inputPrecio.value.trim(),
          // ❌ no mandamos imgPath vacío: evita pisar la imagen existente
        });
        alert("Producto actualizado");
      };

      btnBorrar.onclick = () => {
        deleteProducto(carpeta, idx);
      };

      listaC.appendChild(cont);
    });

    titulo.onclick = () => {
      const abierta = card.classList.toggle("open");
      listaC.style.display = abierta ? "block" : "none";
    };

    card.appendChild(listaC);
    contenedor.appendChild(card);
    aplicarEstilosOCR();
    actualizarKpiProductos();
  }
}
// ================== ESTILOS OCR ==================
function aplicarEstilosOCR() {
  const inputs = document.querySelectorAll(".producto-carpeta input");
  const botones = document.querySelectorAll(".producto-carpeta button");
  const titulos = document.querySelectorAll(".toggle-carpeta");

  inputs.forEach((input) => {
    input.style.padding = "6px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid #334155";
    input.style.background = "#1e293b";
    input.style.color = "#f8fafc";
  });

  botones.forEach((btn) => {
    btn.style.fontSize = "14px";
    btn.style.padding = "6px 8px";
    btn.style.borderRadius = "6px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.marginLeft = "4px";
    btn.style.background = btn.textContent.includes("💾") ? "#0ea5e9" : "#ef4444";
    btn.style.color = "#fff";
  });

  titulos.forEach((titulo) => {
    titulo.style.fontSize = "22px";
    titulo.style.fontWeight = "700";
    titulo.style.color = "#facc15";
    titulo.style.marginBottom = "10px";
    titulo.style.display = "inline-block";
  });
}

// ====== Paginación (manual) ======
if (btnAnterior) {
  btnAnterior.addEventListener("click", () => {
    if (modoLista !== "manual") return;
    if (paginaActual > 1) {
      paginaActual--;
      renderProductos();
    }
  });
}
if (btnSiguiente) {
  btnSiguiente.addEventListener("click", () => {
    if (modoLista !== "manual") return;
    const totalPaginas = Math.ceil(productos.length / productosPorPagina) || 1;
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderProductos();
    }
  });
}

async function fetchProductosIAWeb() {
  const uid = auth?.currentUser?.uid;
  if (!uid) return [];

  const out = [];

  const snapUser = await getDoc(doc(db, "usuarios", uid));
  const categorias = snapUser.data()?.categorias || {};

  for (const carpeta in categorias) {
    (categorias[carpeta] || []).forEach((p, i) => {
      out.push({
  id: null,
  nombre: p.nombre || "Producto",
  precio: p.precio ?? "",
  talles: p.talles || [],
  origen: "ocr",
  origenUrl: p.url || null,
  attrs: p.attrs || null,
  carpeta,
  _src: "ocr",
  _idx: i,
  enStock: (p.enStock !== false) 
});
    });
  }

  const colRef = collection(db, "usuarios", uid, "productos");
  const snapIA = await getDocs(colRef);

  snapIA.forEach((d) => {
    const raw = d.data() || {};
    const origen = raw.origen || raw.tipo || "";
    if (!String(origen).startsWith("ia-")) return;

    out.push({
  id: d.id,
  nombre: raw.nombre || raw.titulo || "Producto",
  precio: raw.precio ?? raw.price ?? "",
  talles: raw.talles || raw.caracteristicas || [],
  origen,
  origenUrl: raw.origenUrl || raw.fuenteUrl || raw.url || raw.urlProducto || null,
  attrs: raw.attrs || null,
  _src: "iaweb",
  _idx: -1,
  enStock: (raw.enStock !== false) 
});
  });

  return out;
}


async function renderListaProductos(listaRender) {
  if (!lista) return;
  lista.innerHTML = "";
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = listaRender.slice(inicio, fin);

  for (const p of productosPagina) {
   const detalleVal = p.detalle ?? p.descripcion ?? (Array.isArray(p.talles) ? p.talles.join("\n") : p.talles) ?? "";

const detalleArr = detalleVal
  ? String(detalleVal).split(/[\n\r]+/g).map(s => s.trim()).filter(Boolean)
  : [];

const detallesHTML = detalleArr.length
  ? detalleArr.map(t => `<div class="detalles"><i class="fas fa-info-circle"></i> ${t}</div>`).join("")
  : "";

    let extrasAttrsHTML = "";
    if (p.attrs && typeof p.attrs === "object" && !Array.isArray(p.attrs)) {
      extrasAttrsHTML = Object.entries(p.attrs)
        .map(
          ([k, v]) =>
            `<div class="detalles"><i class="fas fa-tag"></i> ${k}: ${v}</div>`
        )
        .join("");
    }

    lista.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card-producto"
           data-id="${
  p._src === "ocr"
    ? `ocr:${p.carpeta}:${p._idx}`
    : p._src === "iaweb"
    ? `ia:${p.id}`
    : ""
}"

           data-nombre="${p.nombre || ""}"
           data-precio="${p.precio ?? ""}"
           data-detalle="${(p.detalle ?? p.descripcion ?? (Array.isArray(p.talles) ? p.talles.join(", ") : p.talles) ?? "")}"
data-talles="${(p.detalle ?? p.descripcion ?? (Array.isArray(p.talles) ? p.talles.join(", ") : p.talles) ?? "")}" 
           data-attrs="${encodeAttrs(p.attrs)}">

        <h4>${p.nombre || "Producto"}</h4>
        <div class="precio">$${p.precio ?? 0}</div>
        ${detallesHTML}
        ${extrasAttrsHTML}
        ${
          p.origenUrl || p.url
            ? `<div class="detalles"><i class="fas fa-link"></i> <a href="${normalizeUrl(
                p.origenUrl || p.url
              )}" target="_blank" rel="noopener">Ver</a></div>`
            : ""
        }

        <div class="acciones">
          ${
            p.id
              ? `<button class="btn-editar" type="button"><i class="fas fa-pen"></i> Editar</button>`
              : ""
          }
          ${
            p.id
              ? `
            <button class="btn-eliminar" onclick="${
  p._src === "ocr"
    ? `deleteProducto('${p.carpeta}', ${p._idx})`
    : `borrarProductoIA('${p.id}')`
}">

              <i class="fas fa-trash"></i> Eliminar
            </button>`
              : ""
          }
        </div>
      </div>
    `
    );
  }
  actualizarBotonesPaginacionOCR(listaRender, renderListaProductos);
}

function actualizarBotonesPaginacionOCR(items, renderFn) {
  const totalPaginas = Math.ceil(items.length / productosPorPagina) || 1;

  const enIA = modoLista === "ia";

  if (btnAnterior) btnAnterior.disabled = !enIA || paginaActual === 1;
  if (btnSiguiente) btnSiguiente.disabled = !enIA || paginaActual >= totalPaginas;

  if (btnAnterior) {
    btnAnterior.onclick = () => {
      if (modoLista !== "ia") return;
      if (paginaActual > 1) {
        paginaActual--;
        renderFn(items);
      }
    };
  }

  if (btnSiguiente) {
    btnSiguiente.onclick = () => {
      if (modoLista !== "ia") return;
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderFn(items);
      }
    };
  }

  setPageIndicator(totalPaginas);
}


async function cargarProductosIAWeb() {
  const ia = await fetchProductosIAWeb();
  paginaActual = 1;
  await renderListaProductos(ia);
  actualizarKpiProductos();
}


window.borrarProductoIA = async function (id) {
  try {
    const uid = auth?.currentUser?.uid;
    if (!uid) return alert("No hay usuario logueado.");
    const ok = confirm("¿Eliminar este producto importado por IA?");
    if (!ok) return;
    await deleteDoc(doc(db, "usuarios", uid, "productos", id));
    await cargarProductosIAWeb();
  } catch (e) {
    console.error("Error borrando producto IA:", e);
    alert("No se pudo eliminar.");
  }
};

// ====== SCRAPE UI ======
const $scrUrl = document.getElementById("url-sitio");
const $scrGuardar = document.getElementById("guardar-sitio");
const $scrBtn = document.getElementById("btn-scrapear");
const $scrStatus = document.getElementById("scrape-status");
const $scrOut = document.getElementById("scrape-resultados");

function scrSetStatus(msg) {
  if ($scrStatus) $scrStatus.textContent = msg || "";
}
function urlValida(u) {
  return /^https?:\/\/.+/i.test(u || "");
}

function renderResultadosScrape(items = []) {
  if (!$scrOut) return;
  $scrOut.innerHTML = "";
  if (!items.length) {
    $scrOut.innerHTML = `<div style="color:#94a3b8">No se detectaron productos.</div>`;
    return;
  }
  for (const p of items) {
    const card = document.createElement("div");
    card.style.cssText =
      "border:1px solid #1f2a3a;background:#0b1220;color:#e5e7eb;padding:12px;border-radius:12px";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <strong>${p.nombre || "Producto"}</strong>
        <span>${(p.moneda || "ARS")} ${Number(
      p.precio || 0
    ).toLocaleString()}</span>
      </div>
      ${
        Array.isArray(p.caracteristicas) && p.caracteristicas.length
          ? `<div style="margin-top:6px;color:#9ca3af;font-size:0.9rem">${p.caracteristicas.join(
              " • "
            )}</div>`
          : ""
      }
      ${
        p.urlProducto
          ? `<a href="${p.urlProducto}" target="_blank" style="display:inline-block;margin-top:6px;color:#60a5fa">Ver</a>`
          : ""
      }
    `;
    $scrOut.appendChild(card);
  }
}

async function scrapeSitio(url, guardar) {
  const uid = auth?.currentUser?.uid || null;
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaderSiGuarda(guardar)),
  };
  const resp = await fetch(`${API_BASE}/scrape-products`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, uid, guardar }),
  });
  const json = await resp.json().catch(() => ({}));
  if (resp.status === 401)
    throw new Error(
      json?.error || "No autorizado. Iniciá sesión para guardar."
    );
  if (!resp.ok || json.error)
    throw new Error(json.error || `HTTP ${resp.status}`);
  return json;
}

if ($scrBtn) {
  $scrBtn.addEventListener("click", async () => {
    if (planUsuario !== "experto") {
      scrSetStatus("⚠️ Función disponible solo para el plan Experto.");
      return;
    }

    const url = ($scrUrl?.value || "").trim();
    if (!urlValida(url)) {
      scrSetStatus("Ingresá una URL válida (http/https).");
      return;
    }

    $scrBtn.disabled = true;
    scrSetStatus("Analizando sitio… ⏳");
    $scrOut && ($scrOut.innerHTML = "");

    try {
      const guardar = !!$scrGuardar?.checked;
      const res = await scrapeSitio(url, guardar);
      renderResultadosScrape(res.productos || []);
      scrSetStatus(
        `✅ Detectados ${res.total || 0} productos${
          guardar ? ` • Guardados: ${res.guardados || 0}` : ""
        }`
      );
      if (guardar) {
        await cargarProductosIAWeb();
      }
    } catch (e) {
      console.error(e);
      scrSetStatus(`❌ ${e.message}`);
    } finally {
      $scrBtn.disabled = false;
    }
  });
}

// ====== RESULTADOS BÚSQUEDA ======
async function renderResultadosBusqueda(resultados) {
  if (!lista) return;
  lista.innerHTML = "";

  resultados.forEach((p) => {
    const detallesHTML = Array.isArray(p.talles)
      ? p.talles
          .map(
            (detalle) =>
              `<div class="detalles"><i class="fas fa-info-circle"></i> ${detalle}</div>`
          )
          .join("")
      : p.talles
      ? `<div class="detalles"><i class="fas fa-info-circle"></i> ${p.talles}</div>`
      : "";

    let extrasAttrsHTML = "";
    if (p.attrs && typeof p.attrs === "object" && !Array.isArray(p.attrs)) {
      extrasAttrsHTML = Object.entries(p.attrs)
        .map(
          ([k, v]) =>
            `<div class="detalles"><i class="fas fa-tag"></i> ${k}: ${v}</div>`
        )
        .join("");
    }

    let accionEliminar = "";
    if (p._src === "ocr") {
      accionEliminar = `deleteProducto('${p.carpeta}', ${p._idx})`;
    } else if (p._src === "iaweb") {
      accionEliminar = `borrarProductoIA('${p.id}')`;
    } else {
      accionEliminar = `eliminarProducto(${p._idx})`;
    }

    const dataId =
      p._src === "ocr"
        ? `ocr:${p.carpeta}:${p._idx}`
        : p._src === "iaweb"
        ? `ia:${p.id}`
        : `manual:${p._idx}`;

    const badgeIA =
      p._src === "iaweb"
        ? `<span style="margin-left:.5rem;padding:.15rem .4rem;border-radius:999px;font-size:.7rem;font-weight:700;background:rgba(99,102,241,.15);border:1px solid rgba(147,197,253,.25);color:#93c5fd;">IA</span>`
        : "";

    lista.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card-producto"
           data-id="${dataId}"
           data-nombre="${p.nombre || ""}"
           data-precio="${p.precio ?? ""}"
           data-talles="${
             Array.isArray(p.talles) ? p.talles.join(", ") : p.talles || ""
           }"
           data-attrs="${encodeAttrs(p.attrs)}">

        <h4 style="display:flex;align-items:center;gap:.25rem;">
          ${p.nombre} ${badgeIA}
        </h4>
        <div class="precio">$${p.precio ?? ""}</div>
        ${
          p.ubicacion
            ? `<div class="detalles"><i class="fas fa-map-marker-alt"></i> ${p.ubicacion}</div>`
            : ""
        }
        ${
          p.habitaciones
            ? `<div class="detalles"><i class="fas fa-bed"></i> ${p.habitaciones} habitaciones</div>`
            : ""
        }
        ${
          p.banos
            ? `<div class="detalles"><i class="fas fa-bath"></i> ${p.banos} baños</div>`
            : ""
        }
        ${
          p.extra
            ? `<div class="detalles"><i class="fas fa-swimming-pool"></i> ${p.extra}</div>`
            : ""
        }
        ${detallesHTML}
        ${extrasAttrsHTML}
        ${
          p.carpeta
            ? `<div class="detalles"><i class="fas fa-folder"></i> OCR: ${p.carpeta}</div>`
            : ""
        }
        ${
          p.origenUrl || p.url
            ? `<div class="detalles"><i class="fas fa-link"></i> <a href="${normalizeUrl(
                p.origenUrl || p.url
              )}" target="_blank" rel="noopener">Ver</a></div>`
            : ""
        }

        <div class="acciones">
          <button class="btn-editar" type="button"><i class="fas fa-pen"></i> Editar</button>
          <button class="btn-eliminar" onclick="${accionEliminar}">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    `
    );
  });
}

if (inputBuscador) {
  inputBuscador.addEventListener("input", async () => {
    if (!currentUser) return;
    const texto = (inputBuscador.value || "").toLowerCase().trim();

    if (!texto) {
      if (modoLista === "ia") {
        await cargarProductosIAWeb();
      } else {
        renderProductos();
      }
      return;
    }

    const snapOCR = await getDoc(doc(db, "usuarios", currentUser.uid));
    const categorias = snapOCR.data()?.categorias || {};
    let productosOCR = [];
    for (const carpeta in categorias) {
      productosOCR = productosOCR.concat(
        (categorias[carpeta] || []).map((p, i) => ({
          ...p,
          carpeta,
          _src: "ocr",
          _idx: i,
        }))
      );
    }

    const manualConIdx = (productos || []).map((p, i) => ({
      ...p,
      _src: "manual",
      _idx: i,
    }));

    let iaWeb = [];
    try {
      iaWeb = (await fetchProductosIAWeb()).map((p) => ({
        ...p,
        _src: "iaweb",
        _idx: -1,
      }));
    } catch (e) {
      console.warn("Buscar: no se pudieron leer productos IA-web:", e);
    }

    const todos = [...manualConIdx, ...productosOCR, ...iaWeb];

    const filtrados = todos.filter((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      const precio = String(p.precio ?? "").toLowerCase();
      const talles = (
        Array.isArray(p.talles) ? p.talles.join(" ") : p.talles || ""
      )
        .toString()
        .toLowerCase();
      const origenUrl = (
        p.origenUrl ||
        p.url ||
        p.urlProducto ||
        ""
      ).toLowerCase();

      // ✅ NUEVO: incluir attrs y otros campos en búsqueda
      const attrsText =
        p.attrs && typeof p.attrs === "object"
          ? Object.entries(p.attrs)
              .map(([k, v]) => `${k} ${v}`)
              .join(" ")
              .toLowerCase()
          : "";

      const caracteristicasText = toArrayDetalles(
        p.caracteristicas
      )
        .join(" ")
        .toLowerCase();
      const detallesText = toArrayDetalles(p.detalles)
        .join(" ")
        .toLowerCase();
      const descripcionText = String(
        p.descripcion || p.description || ""
      ).toLowerCase();

      return (
        nombre.includes(texto) ||
        precio.includes(texto) ||
        talles.includes(texto) ||
        origenUrl.includes(texto) ||
        caracteristicasText.includes(texto) || // 👈 nuevo
        detallesText.includes(texto) || // 👈 nuevo
        descripcionText.includes(texto) || // 👈 nuevo
        attrsText.includes(texto)
      );
    });

    renderResultadosBusqueda(filtrados);
  });
}

// ====== Estadísticas demo ======
async function mostrarEstadisticas() {
  if (!currentUser) return;

  const refUsuario = doc(db, "usuarios", currentUser.uid);
  const snap = await getDoc(refUsuario);
  const data = snap.data() || {};
  const ventas = data.ventas || [];

  const contMasVendidos = document.getElementById("mas-vendidos");
  const contUltimosCompradores = document.getElementById(
    "ultimos-compradores"
  );

  if (!ventas.length) {
    contMasVendidos &&
      (contMasVendidos.innerHTML = "<li>No hay ventas registradas</li>");
    contUltimosCompradores &&
      (contUltimosCompradores.innerHTML =
        "<li>No hay compradores registrados</li>");
    return;
  }

  const conteo = {};
  ventas.forEach((v) => {
    conteo[v.producto] = (conteo[v.producto] || 0) + 1;
  });

  const masVendidosOrdenado = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  contMasVendidos &&
    (contMasVendidos.innerHTML = masVendidosOrdenado
      .map(
        ([producto, cantidad]) =>
          `<li>${producto} - ${cantidad} ventas</li>`
      )
      .join(""));
  const ultimos = ventas.slice(-5).reverse();
  contUltimosCompradores &&
    (contUltimosCompradores.innerHTML = ultimos
      .map((v) => `<li>${v.comprador} compró ${v.producto}</li>`)
      .join(""));
}

// ====== Notificaciones (FCM) ======
import {
  getMessaging,
  getToken,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const messaging = getMessaging(app);

async function solicitarPermisoNotificaciones() {
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey:
        "BFIUuPvWgLqJjNyOiRRTTTorJVHBcoRTxmXkROhmOciusIDDZIauwUjPDwroknPXq8GQOTBXjkev5ssK5kCT2qI",
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    if (!currentUser) return;

    await setDoc(
      doc(db, "usuarios", currentUser.uid),
      { pushToken: token },
      { merge: true }
    );
  } catch (error) {
    console.error("❌ Error con notificaciones:", error);
  }
}

// ====== Toggle Manual / IA ======
const filtroManualBtn = document.getElementById("filtro-manual");
const filtroIABtn = document.getElementById("filtro-ia");

if (filtroManualBtn && filtroIABtn) {
  filtroManualBtn.addEventListener("click", () => {
    filtroManualBtn.classList.add("activo");
    filtroIABtn.classList.remove("activo");
    modoLista = "manual";
     if (btnAnterior) btnAnterior.onclick = null;
  if (btnSiguiente) btnSiguiente.onclick = null;
    paginaActual = 1;
    renderProductos();
  });

  filtroIABtn.addEventListener("click", async () => {
    filtroIABtn.classList.add("activo");
    filtroManualBtn.classList.remove("activo");
    modoLista = "ia";
    paginaActual = 1;
    await cargarProductosIAWeb();
  });
}

// ====== Guardar info negocio ======
if (negocioForm) {
  negocioForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("⚠️ No hay usuario logueado");
    const texto = (descripcionNegocio?.value || "").trim();
    if (!texto) return alert("Por favor escribí información válida");
    try {
      await setDoc(
        doc(db, "usuarios", currentUser.uid),
        { infoNegocio: texto },
        { merge: true }
      );
      if (estadoNegocio) {
        estadoNegocio.classList.remove("hidden");
        estadoNegocio.textContent =
          "✅ Información guardada correctamente";
        estadoNegocio.classList.add("text-green-400");
        setTimeout(
          () => estadoNegocio.classList.add("hidden"),
          3000
        );
      }
    } catch (err) {
      console.error("❌ Error guardando info del negocio:", err);
      if (estadoNegocio) {
        estadoNegocio.classList.remove("hidden");
        estadoNegocio.textContent =
          "❌ Error al guardar. Intenta de nuevo.";
        estadoNegocio.classList.add("text-red-400");
      }
    }
  });
}

// ====== onAuthStateChanged ======
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  // 🔒 GATE: bloquear si el email no está verificado
  try {
    await user.reload(); // refresca emailVerified
  } catch {}
  const verified =
    auth.currentUser?.emailVerified === true ||
    user.providerData?.some((p) => p?.providerId?.includes("google")); // Google entra directo

  if (!verified) {
    // Ocultar app y mostrar pantalla de verificación
    const loader = document.getElementById("loader");
    const appWrap = document.getElementById("admin-wrapper");
    if (loader) loader.style.display = "none";
    if (appWrap) {
      appWrap.style.display = "none";
      appWrap.style.pointerEvents = "none";
    }

    document.body.innerHTML = `
      <div style="max-width:520px;margin:60px auto;padding:24px;border-radius:16px;background:#111827;color:#fff;text-align:center">
        <h2>Confirmá tu email</h2>
        <p>Te enviamos un enlace a <b>${user.email}</b>. Abrilo y volvé a ingresar.</p>
        <button id="resend" style="margin-top:12px;padding:10px 16px;border-radius:10px;background:#2563eb;color:#fff;border:none;cursor:pointer">Reenviar correo</button>
        <button id="logout" style="margin-top:10px;padding:10px 16px;border-radius:10px;background:#374151;color:#fff;border:none;cursor:pointer">Cerrar sesión</button>
      </div>
    `;
    document
      .getElementById("resend")
      ?.addEventListener("click", async () => {
        try {
          await sendEmailVerification(auth.currentUser, {
            url: "https://myassistant.com.ar/index.html?verified=1", // ← tu URL de retorno
          });
          alert(
            "Correo reenviado. Revisá SPAM/promociones si no lo ves."
          );
        } catch (e) {
          alert("No se pudo reenviar el correo.");
        }
      });
    document
      .getElementById("logout")
      ?.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
      });
    return; // 👈 importantísimo: no sigas cargando el panel
  }

  const refUser = doc(db, "usuarios", user.uid);
  const snap = await getDoc(refUser);
  if (!snap.exists()) return (window.location.href = "index.html");

  const data = snap.data() || {};
  window.__userData = data;
  const linkGuardado = data.linkTienda || null;

  if (descripcionNegocio && data.infoNegocio)
    descripcionNegocio.value = data.infoNegocio;
  if (inputTienda && linkGuardado) inputTienda.value = linkGuardado;
  mostrarEstadoTienda(linkGuardado);

  const rawPlan = (data.plan || "free").toLowerCase();
  const plan = effectivePlanFromData(rawPlan, data);
  planUsuario = plan;
  window.effectivePlan = plan;

  if (rawPlan === "trial" && isTrialActive(data)) {
    startTrialCountdown(data.trialEndsAt);
  }

  const allowedRaw = ["basico", "pro", "experto"];
  const trialOk = rawPlan === "trial" ? isTrialActive(data) : true;
  const canAccess =
    allowedRaw.includes(rawPlan) ||
    (rawPlan === "trial" && trialOk);

  if (!canAccess) {
    const loader = document.getElementById("loader");
    const appWrap = document.getElementById("admin-wrapper");

    if (loader) loader.style.display = "none";
    if (appWrap) {
      appWrap.style.display = "none";
      appWrap.style.pointerEvents = "none";
    }

    if (!sessionStorage.getItem("trial_expired_shown")) {
      sessionStorage.setItem("trial_expired_shown", "1");
      showTrialExpiredModal({
        onUpgrade: () =>
          (window.location.href = "index.html#planes"),
        onContact: () =>
          window.open(
            "https://www.instagram.com/myassistant.ai/",
            "_blank"
          ),
        hideApp: true,
      });
    }

    setTimeout(() => {
      if (
        document.getElementById("admin-wrapper")?.style.display !==
        "block"
      ) {
        window.location.replace("index.html#planes");
      }
    }, 1000);

    return;
  }

  if (linkOCR) {
    linkOCR.style.display =
      plan === "pro" || plan === "experto" ? "flex" : "none";
  }

  // Link de Mensaje Automático visible para PRO y EXPERTO
  if (linkMensajeAuto) {
    linkMensajeAuto.style.display =
      plan === "pro" || plan === "experto" ? "flex" : "none";
  }

  if (importarWeb) importarWeb.style.display = plan === "experto" ? "block" : "none";
  if (importarUpsell) importarUpsell.style.display = plan === "experto" ? "none" : "block";

  if (plan !== "experto") {
    $scrUrl && ($scrUrl.value = "");
    $scrOut && ($scrOut.innerHTML = "");
  }

  // --- handler robusto para "Mi plan" ---
  let planPanelAbierto = false;
  let ultimoTogglePlan = 0;

  if (btnMiPlan && planPanel && planEmailEl && planTipoEl && planUsadasEl) {
    const abrirPlan = (dataObj, userObj) => {
      planEmailEl.textContent = userObj?.email || "– sin email –";
      planTipoEl.textContent = (dataObj?.plan || "free").toUpperCase();
      planUsadasEl.textContent = dataObj?.respuestasUsadas ?? 0;

      if ((dataObj?.plan || "").toLowerCase() === "trial" && isTrialActive(dataObj)) {
        startTrialCountdown(dataObj.trialEndsAt);
      }
      planPanel.classList.remove("hidden");
      planPanelAbierto = true;
    };

    const cerrarPlan = () => {
      planPanel.classList.add("hidden");
      planPanelAbierto = false;
    };

    btnMiPlan.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const ahora = Date.now();
      if (ahora - ultimoTogglePlan < 300) return;
      ultimoTogglePlan = ahora;

      if (!planPanelAbierto) {
        abrirPlan(window.__userData || {}, auth.currentUser || {});
      } else {
        cerrarPlan();
      }
    });

    document.addEventListener("click", (e) => {
      if (!planPanelAbierto) return;
      const dentro = planPanel.contains(e.target) || btnMiPlan.contains(e.target);
      if (!dentro) cerrarPlan();
    });

    planPanel.addEventListener("click", (e) => e.stopPropagation());
  }

  const seccionMensaje = document.getElementById("mensaje-auto-seccion");
  if (seccionMensaje)
    seccionMensaje.style.display =
      plan === "pro" || plan === "experto" ? "block" : "none";

  if (plan === "pro" || plan === "experto") {
    ocrSectionPanel && (ocrSectionPanel.style.display = "block");
    const categoriasOcr = document.getElementById("categorias-ocr");
    categoriasOcr && (categoriasOcr.style.display = "block");
  } else {
    ocrSectionPanel && (ocrSectionPanel.style.display = "none");
    const categoriasOcr = document.getElementById("categorias-ocr");
    categoriasOcr && (categoriasOcr.style.display = "none");
  }

  document.getElementById("loader")?.style &&
    (document.getElementById("loader").style.display = "none");
  document.getElementById("admin-wrapper")?.style &&
    (document.getElementById("admin-wrapper").style.display = "block");

  currentUser = user;
  window.currentUser = user;

  // ===== RESERVAS: inicializar UI y link =====
  try {
    initReservasUI(user.uid);
    wireReservaLinkUI(user.uid);
    console.log("🔗 Link de reservas:", getReservaLink(user.uid));
  } catch (e) {
    console.warn("Reservas UI no inicializada:", e);
  }

  productos = (data.productos || []).map(p => ({
  ...p,
  enStock: (p.enStock !== false) 
}));
  infoExtra = data.info || "";
  if (infoInput) infoInput.value = infoExtra;

  renderInfo(data);
  renderProductos();
  renderCategoriasOCR();
  if (document.getElementById("mas-vendidos")) {
    mostrarEstadisticas();
  }

  solicitarPermisoNotificaciones();

  if ((planUsuario === "pro" || planUsuario === "experto") && formMensajeAuto) {
    formMensajeAuto.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mensaje = document.getElementById("mensajeTexto")?.value.trim();
      const hora = document.getElementById("horaEnvio")?.value;
      const dias = Array.from(
        document.querySelectorAll("input[name='dias']:checked")
      ).map((el) => el.value);

      const kwInput = document.getElementById("mensajeKeywords");
      const keywords = kwInput
        ? kwInput.value
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : [];

      if (!mensaje || !hora || dias.length === 0) {
        return alert("Por favor completá todos los campos.");
      }

      await setDoc(
        refUser,
        { mensajeProgramado: { mensaje, hora, dias, keywords } },
        { merge: true }
      );

      const okEl = document.getElementById("mensajeProgramadoGuardado");
      okEl && (okEl.innerText = "✅ Mensaje guardado correctamente.");
    });
  }
  hideLoader();
});

// ========= KPI Tiempo Real (robusto) =========
(() => {
  // Esperar a que el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKPI);
  } else {
    initKPI();
  }

  async function initKPI() {
    // Referencias del DOM
    const $kpiProductos = document.getElementById("kpi-productos");
    const $kpiReservas = document.getElementById("kpi-reservas");
    const $kpiIA = document.getElementById("kpi-ia");

    if (!$kpiProductos || !$kpiReservas || !$kpiIA) {
      console.warn("[KPI] No encontré los elementos KPI en el DOM.");
      return;
    }

    // Tomar auth y db ya inicializados si existen
    let a = typeof auth !== "undefined" ? auth : null;
    let d = typeof db !== "undefined" ? db : null;

    // Si no existen, intentar importarlos desde Firebase v10 (mismo CDN que usás)
    if (!a || !d) {
      try {
        const [
          { getAuth, onAuthStateChanged },
          { getFirestore, collection, doc, onSnapshot },
        ] = await Promise.all([
          import(
            "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js"
          ),
          import(
            "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js"
          ),
        ]);

        // Si ya tenés app inicializada en otro archivo (firebase.js), getAuth/getFirestore la reutilizan.
        a = a || getAuth();
        d = d || getFirestore();

        // Colgar helpers en window para el resto del bloque
        window._fbAuth = { getAuth, onAuthStateChanged };
        window._fbFS = { getFirestore, collection, doc, onSnapshot };
      } catch (e) {
        console.error(
          "[KPI] No pude cargar Firebase modules automáticamente:",
          e
        );
      }
    }

    if (!a || !d) {
      console.error(
        "[KPI] No hay auth/db disponibles. Verificá que inicializás Firebase antes."
      );
      return;
    }

    const fmt = (n) =>
      typeof n === "number" ? n.toLocaleString("es-AR") : "—";
    const setDashes = () => {
      $kpiProductos.textContent = "—";
      $kpiReservas.textContent = "—";
      $kpiIA.textContent = "—";
    };

    const todayISO = () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };
    const isTimestampLike = (v) => v && typeof v.toDate === "function";

    let unsubs = [];
    const clearUnsubs = () => unsubs.forEach((u) => { try { u(); } catch {} });
    const listen = (fn) => {
      unsubs.push(fn);
      return fn;
    };

    const { onAuthStateChanged } = window._fbAuth || {};
    const boot = (user) => {
      clearUnsubs();
      if (!user) {
        console.warn("[KPI] No hay usuario logueado.");
        setDashes();
        return;
      }
      const uid = user.uid;

      // ---- Productos (manual + IA/OCR) ----
      try {
        const { collection, onSnapshot } = window._fbFS || {};
        const colMan = collection(d, `usuarios/${uid}/productos`);
        const colOCR = collection(d, `usuarios/${uid}/categorias`);

        let manual = 0,
          ocr = 0;

        const u1 = onSnapshot(
          colMan,
          (snap) => {
            manual = snap.size;
            $kpiProductos.textContent = fmt(manual + ocr);
          },
          (err) => console.error("[KPI] productos:", err)
        );
        listen(u1);

        const u2 = onSnapshot(
          colOCR,
          (snap) => {
            let total = 0;
            snap.forEach((docu) => {
              const data = docu.data() || {};
              if (Array.isArray(data.items)) total += data.items.length;
              else if (Array.isArray(data.productos))
                total += data.productos.length;
              else if (typeof data.count === "number") total += data.count;
            });
            ocr = total;
            $kpiProductos.textContent = fmt(manual + ocr);
          },
          (err) => console.error("[KPI] categorias:", err)
        );
        listen(u2);
      } catch (e) {
        console.error(
          "[KPI] Error configurando listeners de productos:",
          e
        );
      }

      // ---- Reservas activas (visitas >= hoy) ----
      try {
        const { collection, onSnapshot } = window._fbFS || {};
        const colVis = collection(d, `usuarios/${uid}/visitas`);
        const u3 = onSnapshot(
          colVis,
          (snap) => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            let count = 0;
            snap.forEach((docu) => {
              const v = docu.data() || {};
              if (typeof v.fecha === "string") {
                if (v.fecha >= todayISO()) count++;
              } else if (isTimestampLike(v.fecha)) {
                const dt = v.fecha.toDate();
                dt.setHours(0, 0, 0, 0);
                if (dt >= hoy) count++;
              }
            });
            $kpiReservas.textContent = fmt(count);
          },
          (err) => console.error("[KPI] visitas:", err)
        );
        listen(u3);
      } catch (e) {
        console.error(
          "[KPI] Error configurando listeners de reservas:",
          e
        );
      }

      // ---- Respuestas IA (mes actual) ----
      try {
        const { doc, onSnapshot } = window._fbFS || {};
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        const ref = doc(d, `usuarios/${uid}/uso/${ym}`);

        const u4 = onSnapshot(
          ref,
          (snap) => {
            if (!snap.exists()) {
              $kpiIA.textContent = fmt(0);
              return;
            }
            const data = snap.data() || {};
            const val =
              typeof data.respuestas === "number"
                ? data.respuestas
                : typeof data.respuestasUsadas === "number"
                ? data.respuestasUsadas
                : typeof data.count === "number"
                ? data.count
                : 0;
            $kpiIA.textContent = fmt(val);
          },
          (err) => {
            console.error("[KPI] uso:", err);
            $kpiIA.textContent = "—";
          }
        );
        listen(u4);
      } catch (e) {
        console.error(
          "[KPI] Error configurando listener de uso IA:",
          e
        );
      }
    };

    if (a.currentUser) {
      boot(a.currentUser);
    }
    if (typeof onAuthStateChanged === "function") {
      onAuthStateChanged(a, boot);
    } else {
      // Si no tenemos onAuthStateChanged (por imports previos), reintentar en breve.
      console.warn(
        "[KPI] onAuthStateChanged no disponible. Reintentando en 500ms."
      );
      setTimeout(() => {
        try {
          typeof auth !== "undefined" && auth.currentUser
            ? boot(auth.currentUser)
            : setDashes();
        } catch {
          setDashes();
        }
      }, 500);
    }
  }
})();

// ================== INTERRUPTOR DE IA ==================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("ia-toggle");
  const wrap = document.getElementById("ia-status")?.parentElement;
  const txt = document.getElementById("ia-status-text");
  const dot = document.getElementById("ia-dot");
  const ping = document.getElementById("ia-ping");

  if (!toggle || !txt) return;

  // Clave para guardar el estado localmente
  const lsKey = "iaEnabled";

  // Leer estado previo o default (activo)
  const initial = localStorage.getItem(lsKey) !== "false";
  toggle.checked = initial;
  updateIAState(initial);

  // 🔹 También exponer el estado global para el chat
  window.iaEnabled = initial;

  toggle.addEventListener("change", () => {
    const on = toggle.checked;
    localStorage.setItem(lsKey, on);
    updateIAState(on);

    // actualizar global
    window.iaEnabled = on;

    // Si querés usar este evento en otras partes del sistema (opcional)
    document.dispatchEvent(
      new CustomEvent("ia:toggle", { detail: { enabled: on } })
    );
  });

  function updateIAState(on) {
    txt.textContent = on ? "IA activa" : "IA pausada";
    wrap?.classList.toggle("ia-off", !on);
    if (dot) dot.style.background = on ? "#22c55e" : "#64748b";
    if (ping) ping.style.display = on ? "block" : "none";
  }
 
const stockListEl = document.getElementById("stock-list");
const stockSearchEl = document.getElementById("stock-search");
const stockSourceEl = document.getElementById("stock-source");
const stockStateEl  = document.getElementById("stock-state");

const btnCatalogoSettings = document.getElementById("btnCatalogoSettings");

let stockCache = []; // items normalizados para el drawer

function normTxt(s) {
  return String(s || "").toLowerCase().trim();
}
function safeName(p) {
  return String(p?.nombre || p?.name || "Producto").trim();
}
function safePrice(p) {
  const v = p?.precio ?? p?.price ?? "";
  return String(v || "").trim();
}
function isInStockValue(v) {
  return v !== false;
}

async function fetchCategoriasOCRFromUserDoc() {
  if (!currentUser) return {};
  const ref = doc(db, "usuarios", currentUser.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  return data?.categorias || {};
}

function getVariantOptions(p) {
  const opts = p?.variantes?.opciones;
  if (Array.isArray(opts) && opts.length) return opts.map(x => String(x).trim()).filter(Boolean);
  return [];
}

function initStockVariantesIfMissing(p) {
  const opts = getVariantOptions(p);
  if (!opts.length) return;

  if (!p.stockVariantes || typeof p.stockVariantes !== "object") {
    const base = (p?.enStock === false) ? false : true;
    p.stockVariantes = {};
    opts.forEach(o => p.stockVariantes[o] = base);
  } else {
    opts.forEach(o => {
      if (typeof p.stockVariantes[o] !== "boolean") p.stockVariantes[o] = true;
    });
  }

  const anyOn = opts.some(o => p.stockVariantes[o] === true);
  p.enStock = anyOn;
}

function computeEnStockFromVariants(stockVariantes, opts) {
  if (!opts?.length) return null;
  return opts.some(o => stockVariantes?.[o] === true);
}


async function buildStockCache() {
  const manualItems = (Array.isArray(productos) ? productos : []).map((p, idx) => ({
    src: "manual",
    key: `manual:${idx}`,
    idx,
    nombre: safeName(p),
    precio: safePrice(p),
    variantes: getVariantOptions(p),
stockVariantes: (p && typeof p.stockVariantes === "object") ? p.stockVariantes : null,
enStock: isInStockValue(p?.enStock)

  }));

  let iaItems = [];
  try {
    const ia = await fetchProductosIAWeb();
iaItems = (Array.isArray(ia) ? ia : [])
  .filter(p => p._src === "iaweb" && p.id)  
  .map((p) => ({
    src: "ia",
    key: `ia:${p.id}`,
    id: p.id,
    nombre: safeName(p),
    precio: safePrice(p),
    variantes: getVariantOptions(p),
stockVariantes: (p && typeof p.stockVariantes === "object") ? p.stockVariantes : null,
enStock: isInStockValue(p?.enStock)

  }));
  } catch (e) {
    console.warn("No se pudieron cargar productos IA para drawer:", e?.message || e);
  }

  let ocrItems = [];
  try {
    const categorias = await fetchCategoriasOCRFromUserDoc();
    for (const carpeta of Object.keys(categorias || {})) {
      const arr = Array.isArray(categorias[carpeta]) ? categorias[carpeta] : [];
      arr.forEach((p, idx) => {
        ocrItems.push({
          src: "ocr",
          key: `ocr:${carpeta}:${idx}`,
          carpeta,
          idx,
          nombre: safeName(p),
          precio: safePrice(p),
          variantes: getVariantOptions(p),
stockVariantes: (p && typeof p.stockVariantes === "object") ? p.stockVariantes : null,
enStock: isInStockValue(p?.enStock)

        });
      });
    }
  } catch (e) {
    console.warn("No se pudieron cargar OCR para drawer:", e?.message || e);
  }

  stockCache = [...manualItems, ...iaItems, ...ocrItems];
}

function applyStockFilters(list) {
  const q = normTxt(stockSearchEl?.value);
  const src = stockSourceEl?.value || "all";
  const st  = stockStateEl?.value || "all";

  return (list || []).filter((it) => {
    if (src !== "all" && it.src !== src) return false;

    if (st === "in" && !it.enStock) return false;
    if (st === "out" && it.enStock) return false;

    if (q) {
      const hay = `${normTxt(it.nombre)} ${normTxt(it.precio)} ${normTxt(it.src)}`;
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function stockRowHTML(it) {
  const badge =
    it.src === "manual" ? "Manual" :
    it.src === "ia" ? "IA" : "OCR";

  const badgeClass =
    it.src === "manual" ? "is-manual" :
    it.src === "ia" ? "is-ia" : "is-ocr";

  const price = it.precio ? `<div class="stock-price">${it.precio}</div>` : "";

  const opts = Array.isArray(it.variantes) ? it.variantes : [];
  const map  = (it.stockVariantes && typeof it.stockVariantes === "object") ? it.stockVariantes : {};
  const hasVars = opts.length > 0;

  const chipsHTML = hasVars ? `
    <div class="stock-body">
      <div class="stock-body-title">Variantes</div>
      <div class="stock-chips">
        ${opts.map(o => {
          const on = map[o] !== false;
          return `
            <button type="button"
              class="stock-chip-btn ${on ? "on" : "off"}"
              data-chip="1"
              data-src="${it.src}"
              data-idx="${it.idx ?? ""}"
              data-id="${it.id ?? ""}"
              data-carpeta="${it.carpeta ?? ""}"
              data-opt="${String(o).replace(/"/g, "&quot;")}"
            >
              <span class="chip-dot"></span>
              ${o}
            </button>
          `;
        }).join("")}
      </div>
    </div>
  ` : "";

return `
  <div class="stock-acc" data-stock="${it.enStock ? "true" : "false"}">
    <button type="button" class="stock-headbtn" data-acc-toggle="1">
      <div class="stock-left">
        <span class="stock-dot ${it.enStock ? "on" : ""}"></span>

        <div class="stock-titlewrap">
          <div class="stock-row1">
            <div class="stock-title">${it.nombre}</div>
          </div>

          <div class="stock-row2">
            <div class="stock-meta-left">
              <span class="stock-badge ${badgeClass}">${badge}</span>
              ${it.src === "ocr" && it.carpeta ? `<span class="stock-carpeta">• ${it.carpeta}</span>` : ""}
            </div>
            <div class="stock-meta-right">
              ${it.precio ? String(it.precio) : ""}
            </div>
          </div>

          <div class="stock-row3">
            <div class="stock-actions">
              <label class="mini-switch" aria-label="Stock">
                <input type="checkbox"
                  class="stock-toggle"
                  ${it.enStock ? "checked" : ""}
                  data-src="${it.src}"
                  data-idx="${it.idx ?? ""}"
                  data-id="${it.id ?? ""}"
                  data-carpeta="${it.carpeta ?? ""}"
                />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <span class="stock-chev">⌄</span>
          </div>
        </div>
      </div>
    </button>

    ${chipsHTML}
  </div>
`;
}

async function renderStockDrawer() {
  if (!stockListEl) return;
  await buildStockCache();

  const filtered = applyStockFilters(stockCache);
  stockListEl.innerHTML = filtered.map(stockRowHTML).join("");

  try { window.lucide?.createIcons?.(); } catch {}
}

async function persistStockChange({ src, idx, id, carpeta, opt }, enStock) {
  if (!currentUser) throw new Error("No hay usuario logueado.");

  const userRef = doc(db, "usuarios", currentUser.uid);

if (src === "manual") {
  const i = Number(idx);
  if (!Number.isFinite(i) || i < 0 || i >= productos.length) return;

  const p = productos[i];
  initStockVariantesIfMissing(p);

  if (opt) {
    p.stockVariantes = p.stockVariantes || {};
    p.stockVariantes[String(opt)] = (enStock === true);

    const opts = getVariantOptions(p);
    const derived = computeEnStockFromVariants(p.stockVariantes, opts);
    if (derived !== null) p.enStock = derived;

    await setDoc(userRef, { productos }, { merge: true });
    await renderProductos();
    if (typeof buildStockCache === "function") buildStockCache();
    if (typeof renderStockDrawerFiltered === "function") renderStockDrawerFiltered();
    return;
  }

  const opts = getVariantOptions(p);
  if (opts.length) {
    p.stockVariantes = p.stockVariantes || {};
    opts.forEach(o => p.stockVariantes[o] = (enStock === true));
  }

  p.enStock = (enStock === true);

  await setDoc(userRef, { productos }, { merge: true });
  await renderProductos();
  if (typeof buildStockCache === "function") buildStockCache();
  if (typeof renderStockDrawerFiltered === "function") renderStockDrawerFiltered();
  return;
}

if (src === "ia") {
  if (!id) return;

  const ref = doc(db, "usuarios", currentUser.uid, "productos", id);

  if (opt) {
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const p = { ...data };

    initStockVariantesIfMissing(p);
    p.stockVariantes = p.stockVariantes || {};
    p.stockVariantes[String(opt)] = (enStock === true);

    const opts = getVariantOptions(p);
    const derived = computeEnStockFromVariants(p.stockVariantes, opts);
    if (derived !== null) p.enStock = derived;

    await updateDoc(ref, { stockVariantes: p.stockVariantes, enStock: p.enStock });
    await renderProductos();
    return;
  }

  await updateDoc(ref, { enStock });
  await renderProductos();
  return;
}

  if (src === "ocr") {
    if (!carpeta) return;

    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const categorias = data?.categorias || {};
    const arr = Array.isArray(categorias[carpeta]) ? categorias[carpeta] : [];

    const i = Number(idx);
    if (!Number.isFinite(i) || !arr[i]) return;

    arr[i].enStock = (enStock === true);
    categorias[carpeta] = arr;

    await setDoc(userRef, { categorias }, { merge: true });

    await renderProductos();
    return;
  }
}

stockSearchEl?.addEventListener("input", () => renderStockDrawer());
stockSourceEl?.addEventListener("change", () => renderStockDrawer());
stockStateEl?.addEventListener("change", () => renderStockDrawer());

stockListEl?.addEventListener("change", async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLInputElement)) return;

  if (t.classList.contains("stock-toggle")) {
    const payload = {
      src: t.dataset.src,
      idx: t.dataset.idx,
      id: t.dataset.id,
      carpeta: t.dataset.carpeta
    };

    const wanted = !!t.checked;
    t.disabled = true;

    try {
      await persistStockChange(payload, wanted);
      await renderStockDrawer();
    } catch (err) {
      console.error("Error guardando stock:", err);
      t.checked = !wanted;
    } finally {
      t.disabled = false;
    }
    return;
  }

  if (t.classList.contains("stock-var-toggle")) {
    const payload = {
      src: t.dataset.src,
      idx: t.dataset.idx,
      id: t.dataset.id,
      carpeta: t.dataset.carpeta,
      opt: t.dataset.opt
    };

    const wanted = !!t.checked;
    t.disabled = true;

    try {
      await persistStockChange(payload, wanted);
      await renderStockDrawer();
    } catch (err) {
      console.error("Error guardando stock por talle:", err);
      t.checked = !wanted;
    } finally {
      t.disabled = false;
    }
  }
});

stockListEl?.addEventListener("click", async (e) => {
  const accBtn = e.target.closest("[data-acc-toggle]");
  if (accBtn) {
    const acc = accBtn.closest(".stock-acc");
    if (acc) acc.classList.toggle("open");
    return;
  }

  const chip = e.target.closest("[data-chip]");
  if (!chip) return;

  const payload = {
    src: chip.dataset.src,
    idx: chip.dataset.idx,
    id: chip.dataset.id,
    carpeta: chip.dataset.carpeta,
    opt: chip.dataset.opt
  };

  const wanted = !chip.classList.contains("on");
  chip.disabled = true;

  try {
    await persistStockChange(payload, wanted);
    await renderStockDrawer();
  } catch (err) {
    console.error("Error guardando stock por variante:", err);
  } finally {
    chip.disabled = false;
  }
});
  
btnCatalogoSettings?.addEventListener("click", () => {
  setTimeout(() => renderStockDrawer(), 0);
});

});

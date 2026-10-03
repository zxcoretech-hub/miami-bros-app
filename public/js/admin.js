import { db } from './firebase.js';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

/* ===== Utilidades ===== */
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || '').toString().replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + (parseFloat(n) || 0).toFixed(2);

/* Colores de etiqueta: lo que ve el cliente (amigable) -> clase real que usa la web */
const COLORS = [
  { id: 'rojo',   lab: 'Rojo',   cls: 'bg-primary text-on-primary',                     css: 'background:#bb0015;color:#fff' },
  { id: 'dorado', lab: 'Dorado', cls: 'bg-secondary-container text-on-secondary-container', css: 'background:#feb700;color:#6b4b00' },
  { id: 'ambar',  lab: 'Ámbar',  cls: 'bg-amber-400 text-on-secondary-container',        css: 'background:#fbbf24;color:#6b4b00' },
  { id: 'verde',  lab: 'Verde',  cls: 'bg-emerald-500 text-white',                       css: 'background:#10b981;color:#fff' },
];
const colorById = (id) => COLORS.find(c => c.id === id) || COLORS[0];
const clsToColorId = (cls) => (COLORS.find(c => c.cls === cls) || COLORS[0]).id;

/* ===== Estado ===== */
let productos = [], categorias = [], promos = [], opiniones = [], locales = [];
let activeCat = 'Todos', catPills = ['Todos'];
let editingProd = null, prodColor = 'rojo';
let editingPromo = null;
let editingRes = null, resStars = 5;
let editingLoc = null;
let editingCat = null;
let confirmCb = null;

/* ===== Helpers de UI ===== */
function openSheet(id) { $(id).classList.add('open'); }
function closeSheet(id) { $(id).classList.remove('open'); }
window.closeSheet = closeSheet;

let toastT;
function toast(msg) {
  $('toastMsg').textContent = msg;
  const t = $('toast');
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

function askConfirm(title, text, cb) {
  $('confirmTitle').textContent = title;
  $('confirmText').textContent = text;
  confirmCb = cb;
  openSheet('confirmScrim');
}

function withSpinner(btn, run) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg> Guardando…';
  return Promise.resolve().then(run).finally(() => { btn.disabled = false; btn.innerHTML = orig; });
}

const emptyState = (txt) => `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg><div>${txt}</div></div>`;

/* ===== Navegación ===== */
const SUBS = { inicio: 'Panel del administrador', menu: 'Gestión del menú', promos: 'Promociones', resenas: 'Reseñas de clientes', negocio: 'Datos del negocio' };
function go(v) {
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  $('view-' + v).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  const sub = $('topsub'); if (sub) sub.textContent = SUBS[v] || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.go = go;

/* ===== Reordenar (intercambia el campo "orden") ===== */
const COLL = {
  productos:  { get: () => productos,  reload: loadProductos },
  promociones:{ get: () => promos,     reload: loadPromos },
  opiniones:  { get: () => opiniones,  reload: loadOpiniones },
  locales:    { get: () => locales,    reload: loadLocales },
  categorias: { get: () => categorias, reload: loadCategorias },
};
window.move = async (coll, id, dir) => {
  const arr = COLL[coll].get();
  const i = arr.findIndex(x => x.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  const a = arr[i], b = arr[j];
  const ao = (a.orden ?? i), bo = (b.orden ?? j);
  try {
    await Promise.all([
      setDoc(doc(db, coll, a.id), { orden: bo }, { merge: true }),
      setDoc(doc(db, coll, b.id), { orden: ao }, { merge: true }),
    ]);
    await COLL[coll].reload();
  } catch (e) { console.error(e); toast('No se pudo reordenar'); }
};

function reorderBtns(coll, id, i, n) {
  return `<div class="reord">
    <button class="mini" ${i === 0 ? 'disabled' : ''} onclick="move('${coll}','${id}',-1)" aria-label="Subir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
    <button class="mini" ${i === n - 1 ? 'disabled' : ''} onclick="move('${coll}','${id}',1)" aria-label="Bajar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
  </div>`;
}
const editBtn = (fn, id) => `<button class="mini" onclick="${fn}('${id}')" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>`;

/* ===== PRODUCTOS ===== */
async function loadProductos() {
  try {
    const snap = await getDocs(query(collection(db, 'productos'), orderBy('orden')));
    productos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); productos = []; }
  renderProd(); updateStats(); renderHomeRecent();
}
function renderProd() {
  const list = $('prodList');
  const all = activeCat === 'Todos';
  const items = all ? productos : productos.filter(p => p.categoria === activeCat);
  if (!items.length) { list.innerHTML = emptyState(all ? 'Aún no tienes productos. Toca “Agregar producto”.' : 'No hay productos en esta categoría.'); return; }
  list.innerHTML = items.map((p, i) => {
    const thumb = p.imagen_url
      ? `<div class="thumb" style="background-image:url(&quot;${p.imagen_url}&quot;)"></div>`
      : `<div class="thumb">🍽️</div>`;
    return `<div class="row">
      ${thumb}
      <div class="info">
        <div class="nm">${esc(p.titulo)}</div>
        <div class="meta">
          <span class="price">${money(p.precio)}</span>
          <span class="chip ${p.activo ? 'chip-on' : 'chip-off'}">${p.activo ? 'Visible' : 'Oculto'}</span>
          ${p.insignia ? `<span class="chip chip-badge">${esc(p.insignia)}</span>` : ''}
        </div>
      </div>
      <div class="acts">${all ? reorderBtns('productos', p.id, i, items.length) : ''}${editBtn('openProd', p.id)}</div>
    </div>`;
  }).join('');
}
function renderCats() {
  catPills = ['Todos', ...categorias.map(c => c.nombre)];
  $('catScroll').innerHTML = catPills.map((c, i) =>
    `<button class="cat-pill ${c === activeCat ? 'active' : ''}" onclick="setCat(${i})">${esc(c)}</button>`).join('');
}
window.setCat = (i) => { activeCat = catPills[i] || 'Todos'; renderCats(); renderProd(); };

function fillCatSelect(selected) {
  const sel = $('fCat');
  sel.innerHTML = '';
  if (!categorias.length) { $('fCatHint').hidden = false; return; }
  $('fCatHint').hidden = true;
  categorias.forEach(c => {
    const o = document.createElement('option');
    o.value = c.nombre; o.textContent = c.nombre;
    if (c.nombre === selected) o.selected = true;
    sel.appendChild(o);
  });
}
function renderSwatches() {
  $('swatches').innerHTML = COLORS.map(c =>
    `<span class="swatch ${c.id === prodColor ? 'sel' : ''}" style="${c.css}" onclick="setColor('${c.id}')">${c.lab}</span>`).join('');
}
window.setColor = (id) => { prodColor = id; renderSwatches(); syncPv(); };

function setPvImage(src, emoji) {
  const pv = $('pvImg'), em = $('pvEmoji');
  if (src) {
    pv.style.backgroundImage = `url("${src}")`; em.style.display = 'none';
  } else {
    pv.style.backgroundImage = ''; em.style.display = ''; em.textContent = emoji || '🍗';
  }
}
function syncPv() {
  $('pvTtl').textContent = $('fNombre').value || 'Nombre del producto';
  $('pvDesc').textContent = $('fDesc').value || 'Descripción…';
  $('pvPrice').textContent = money($('fPrecio').value);
  const bd = $('fBadge').value, badge = $('pvBadge');
  if (bd) { badge.hidden = false; badge.textContent = bd; badge.setAttribute('style', colorById(prodColor).css); }
  else badge.hidden = true;
}
window.openProd = (id) => {
  editingProd = id;
  const p = id ? productos.find(x => x.id === id) : null;
  $('prodTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
  $('delProd').style.display = p ? 'flex' : 'none';
  $('fNombre').value = p ? (p.titulo || '') : '';
  $('fPrecio').value = p ? (p.precio ?? '') : '';
  $('fDesc').value = p ? (p.descripcion || '') : '';
  $('fBadge').value = p ? (p.insignia || '') : '';
  $('fPedidosya').value = p ? (p.link_pedidos_ya || '') : '';
  prodColor = p ? clsToColorId(p.insignia_color) : 'rojo';
  const on = p ? !!p.activo : true;
  $('fSw').classList.toggle('on', on); $('fSw').setAttribute('aria-checked', on);
  fillCatSelect(p ? p.categoria : null);
  renderSwatches();
  $('fFotoUrl').value = p ? (p.imagen_url || '') : '';
  setPvImage(p && p.imagen_url ? p.imagen_url : null, '🍗');
  syncPv();
  openSheet('prodScrim');
};
async function saveProd() {
  const titulo = $('fNombre').value.trim();
  if (!titulo) { toast('Escribe un nombre primero'); return; }
  if (!categorias.length) { toast('Crea una categoría primero (botón “Categorías”)'); return; }
  await withSpinner($('saveProd'), async () => {
    const existing = editingProd ? productos.find(x => x.id === editingProd) : null;
    const id = editingProd || `prod-${Date.now()}`;
    const imagen_url = $('fFotoUrl').value.trim(); // vacío → la web muestra el placeholder de marca
    const precio = parseFloat($('fPrecio').value) || 0;
    const nameChanged = existing && existing.titulo !== titulo;
    const mensaje_wa = (existing && existing.mensaje_wa && !nameChanged)
      ? existing.mensaje_wa : `Hola quiero pedir ${titulo} en Panama`;
    const orden = existing ? (existing.orden ?? productos.length)
      : (productos.reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1);
    const data = {
      titulo,
      categoria: $('fCat').value,
      descripcion: $('fDesc').value.trim(),
      precio,
      precioStr: `${money(precio)} USD`,
      insignia: $('fBadge').value.trim(),
      insignia_color: colorById(prodColor).cls,
      mensaje_wa,
      link_pedidos_ya: $('fPedidosya').value.trim(),
      imagen_url,
      activo: $('fSw').classList.contains('on'),
      orden,
    };
    try {
      await setDoc(doc(db, 'productos', id), data);
      closeSheet('prodScrim'); await loadProductos(); toast('✓ Producto guardado');
    } catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  });
}
function deleteProd() {
  if (!editingProd) return;
  askConfirm('¿Eliminar este producto?', 'Dejará de aparecer en tu web. Esta acción no se puede deshacer.', async () => {
    try { await deleteDoc(doc(db, 'productos', editingProd)); closeSheet('prodScrim'); await loadProductos(); toast('Producto eliminado'); }
    catch (e) { console.error(e); toast('Error al eliminar'); }
  });
}

/* ===== PROMOCIONES ===== */
async function loadPromos() {
  try {
    const snap = await getDocs(query(collection(db, 'promociones'), orderBy('orden')));
    promos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); promos = []; }
  renderPromos();
}
function renderPromos() {
  const list = $('promoList');
  if (!promos.length) { list.innerHTML = emptyState('Aún no tienes promociones. Toca “Nueva promoción”.'); return; }
  list.innerHTML = promos.map((p, i) => `
    <div class="row">
      ${p.imagen ? `<div class="thumb" style="background-image:url(&quot;${p.imagen}&quot;)"></div>` : `<div class="thumb">📢</div>`}
      <div class="info"><div class="nm">${esc(p.titulo)}</div><div class="meta">${p.etiqueta ? `<span class="chip chip-badge">${esc(p.etiqueta)}</span>` : ''}</div></div>
      <div class="acts">${reorderBtns('promociones', p.id, i, promos.length)}${editBtn('openPromo', p.id)}</div>
    </div>`).join('');
}
window.openPromo = (id) => {
  editingPromo = id;
  const p = id ? promos.find(x => x.id === id) : null;
  $('promoTitle').textContent = p ? 'Editar promoción' : 'Nueva promoción';
  $('delPromo').style.display = p ? 'flex' : 'none';
  $('pTitulo').value = p ? (p.titulo || '') : '';
  $('pEtiqueta').value = p ? (p.etiqueta || '') : '';
  $('pDesc').value = p ? (p.descripcion || '') : '';
  $('pFotoUrl').value = p ? (p.imagen || '') : '';
  setPromoPreview(p && p.imagen ? p.imagen : null);
  openSheet('promoScrim');
};
function setPromoPreview(src) {
  const ph = $('promoPh');
  if (src) { ph.style.backgroundImage = `url("${src}")`; ph.textContent = ''; }
  else { ph.style.backgroundImage = ''; ph.textContent = '📢'; }
}
async function savePromo() {
  const titulo = $('pTitulo').value.trim();
  if (!titulo) { toast('Escribe un título primero'); return; }
  await withSpinner($('savePromo'), async () => {
    const existing = editingPromo ? promos.find(x => x.id === editingPromo) : null;
    const imagen = $('pFotoUrl').value.trim();
    if (!imagen) { toast('Pega el enlace de una foto para la promoción'); throw new Error('sin imagen'); }
    const orden = existing ? (existing.orden ?? promos.length) : (promos.reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1);
    const data = { titulo, etiqueta: $('pEtiqueta').value.trim(), descripcion: $('pDesc').value.trim(), imagen, orden };
    const id = editingPromo || doc(collection(db, 'promociones')).id;
    try { await setDoc(doc(db, 'promociones', id), data); closeSheet('promoScrim'); await loadPromos(); toast('✓ Promoción guardada'); }
    catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  }).catch(() => {});
}
function deletePromo() {
  if (!editingPromo) return;
  askConfirm('¿Eliminar esta promoción?', 'Dejará de aparecer en tu web.', async () => {
    try { await deleteDoc(doc(db, 'promociones', editingPromo)); closeSheet('promoScrim'); await loadPromos(); toast('Promoción eliminada'); }
    catch (e) { console.error(e); toast('Error al eliminar'); }
  });
}

/* ===== OPINIONES / RESEÑAS ===== */
async function loadOpiniones() {
  try {
    const snap = await getDocs(query(collection(db, 'opiniones'), orderBy('orden')));
    opiniones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); opiniones = []; }
  renderRes(); updateStats();
}
function renderRes() {
  const list = $('resList');
  if (!opiniones.length) { list.innerHTML = emptyState('Aún no tienes reseñas. Toca “Agregar reseña”.'); return; }
  list.innerHTML = opiniones.map((r, i) => {
    const initials = (r.nombre || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="row">
      <div class="thumb" style="font-size:20px">${esc(initials)}</div>
      <div class="info"><div class="nm">${esc(r.nombre)} · <span style="color:var(--gold)">${'★'.repeat(r.estrellas || 0)}</span></div>
      <div class="meta" style="color:var(--muted);font-size:12.5px;white-space:normal">“${esc(r.comentario)}”</div></div>
      <div class="acts">${reorderBtns('opiniones', r.id, i, opiniones.length)}${editBtn('openRes', r.id)}</div>
    </div>`;
  }).join('');
}
function renderStarPicker() {
  $('rStars').innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" class="${n <= resStars ? 'on' : ''}" onclick="setStars(${n})">★</button>`).join('');
}
window.setStars = (n) => { resStars = n; renderStarPicker(); };
window.openRes = (id) => {
  editingRes = id;
  const r = id ? opiniones.find(x => x.id === id) : null;
  $('resTitle').textContent = r ? 'Editar reseña' : 'Nueva reseña';
  $('delRes').style.display = r ? 'flex' : 'none';
  $('rNombre').value = r ? (r.nombre || '') : '';
  $('rComentario').value = r ? (r.comentario || '') : '';
  resStars = r ? (r.estrellas || 5) : 5;
  renderStarPicker();
  openSheet('resScrim');
};
async function saveRes() {
  const nombre = $('rNombre').value.trim();
  if (!nombre) { toast('Escribe el nombre del cliente'); return; }
  await withSpinner($('saveRes'), async () => {
    const existing = editingRes ? opiniones.find(x => x.id === editingRes) : null;
    const orden = existing ? (existing.orden ?? opiniones.length) : (opiniones.reduce((m, o) => Math.max(m, o.orden || 0), 0) + 1);
    const data = { nombre, comentario: $('rComentario').value.trim(), estrellas: resStars, orden };
    const id = editingRes || doc(collection(db, 'opiniones')).id;
    try { await setDoc(doc(db, 'opiniones', id), data); closeSheet('resScrim'); await loadOpiniones(); toast('✓ Reseña guardada'); }
    catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  });
}
function deleteRes() {
  if (!editingRes) return;
  askConfirm('¿Eliminar esta reseña?', 'Dejará de aparecer en tu web.', async () => {
    try { await deleteDoc(doc(db, 'opiniones', editingRes)); closeSheet('resScrim'); await loadOpiniones(); toast('Reseña eliminada'); }
    catch (e) { console.error(e); toast('Error al eliminar'); }
  });
}

/* ===== LOCALES ===== */
async function loadLocales() {
  try {
    const snap = await getDocs(query(collection(db, 'locales'), orderBy('orden')));
    locales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); locales = []; }
  renderLoc();
}
function renderLoc() {
  const list = $('locList');
  if (!locales.length) { list.innerHTML = emptyState('Aún no tienes locales.'); return; }
  list.innerHTML = locales.map((l, i) => `
    <div class="row">
      <div class="thumb">📍</div>
      <div class="info"><div class="nm">${esc(l.nombre)}</div><div class="meta" style="color:var(--muted);font-size:12.5px;white-space:normal">${esc(l.direccion || '')}</div></div>
      <div class="acts">${reorderBtns('locales', l.id, i, locales.length)}${editBtn('openLoc', l.id)}</div>
    </div>`).join('');
}
window.openLoc = (id) => {
  editingLoc = id;
  const l = id ? locales.find(x => x.id === id) : null;
  $('locTitle').textContent = l ? 'Editar local' : 'Nuevo local';
  $('delLoc').style.display = l ? 'flex' : 'none';
  $('lNombre').value = l ? (l.nombre || '') : '';
  $('lDir').value = l ? (l.direccion || '') : '';
  $('lHorario').value = l ? (l.horario || '') : '';
  $('lMapa').value = l ? (l.mapa || '') : '';
  openSheet('locScrim');
};
async function saveLoc() {
  const nombre = $('lNombre').value.trim();
  if (!nombre) { toast('Escribe el nombre del local'); return; }
  await withSpinner($('saveLoc'), async () => {
    const existing = editingLoc ? locales.find(x => x.id === editingLoc) : null;
    const orden = existing ? (existing.orden ?? locales.length) : (locales.reduce((m, l) => Math.max(m, l.orden || 0), 0) + 1);
    const data = { nombre, direccion: $('lDir').value.trim(), horario: $('lHorario').value.trim(), mapa: $('lMapa').value.trim(), orden };
    const id = editingLoc || doc(collection(db, 'locales')).id;
    try { await setDoc(doc(db, 'locales', id), data); closeSheet('locScrim'); await loadLocales(); toast('✓ Local guardado'); }
    catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  });
}
function deleteLoc() {
  if (!editingLoc) return;
  askConfirm('¿Eliminar este local?', 'Dejará de aparecer en el pie de tu web.', async () => {
    try { await deleteDoc(doc(db, 'locales', editingLoc)); closeSheet('locScrim'); await loadLocales(); toast('Local eliminado'); }
    catch (e) { console.error(e); toast('Error al eliminar'); }
  });
}

/* ===== CATEGORÍAS ===== */
async function loadCategorias() {
  try {
    const snap = await getDocs(query(collection(db, 'categorias'), orderBy('orden')));
    categorias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); categorias = []; }
  if (activeCat !== 'Todos' && !categorias.some(c => c.nombre === activeCat)) activeCat = 'Todos';
  renderCats(); renderCatList(); renderProd();
}
window.openCats = () => { resetCatForm(); renderCatList(); openSheet('catScrim'); };
function renderCatList() {
  const list = $('catList');
  if (!list) return;
  if (!categorias.length) { list.innerHTML = emptyState('Aún no tienes categorías.'); return; }
  list.innerHTML = categorias.map((c, i) => `
    <div class="row">
      <div class="info"><div class="nm">${esc(c.nombre)}</div></div>
      <div class="acts">${reorderBtns('categorias', c.id, i, categorias.length)}${editBtn('editCat', c.id)}
        <button class="mini" onclick="delCat('${c.id}')" aria-label="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7"/></svg></button>
      </div>
    </div>`).join('');
}
function resetCatForm() {
  editingCat = null; $('catNombre').value = '';
  $('catFormLabel').textContent = 'Nueva categoría';
  $('catSave').textContent = 'Agregar categoría';
  $('catCancel').hidden = true;
}
window.editCat = (id) => {
  const c = categorias.find(x => x.id === id); if (!c) return;
  editingCat = id; $('catNombre').value = c.nombre;
  $('catFormLabel').textContent = 'Editar categoría';
  $('catSave').textContent = 'Guardar cambios';
  $('catCancel').hidden = false;
  $('catNombre').focus();
};
window.delCat = (id) => {
  askConfirm('¿Eliminar esta categoría?', 'Los productos de esta categoría quedarán sin agrupar hasta que les asignes otra.', async () => {
    try { await deleteDoc(doc(db, 'categorias', id)); await loadCategorias(); toast('Categoría eliminada'); }
    catch (e) { console.error(e); toast('Error al eliminar'); }
  });
};
async function saveCat() {
  const nombre = $('catNombre').value.trim();
  if (!nombre) { toast('Escribe un nombre'); return; }
  await withSpinner($('catSave'), async () => {
    const existing = editingCat ? categorias.find(x => x.id === editingCat) : null;
    const orden = existing ? (existing.orden ?? categorias.length) : (categorias.reduce((m, c) => Math.max(m, c.orden || 0), 0) + 1);
    const id = editingCat || doc(collection(db, 'categorias')).id;
    try { await setDoc(doc(db, 'categorias', id), { nombre, orden }); resetCatForm(); await loadCategorias(); toast('✓ Categoría guardada'); }
    catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  });
}

/* ===== CONFIGURACIÓN / NEGOCIO ===== */
async function loadConfig() {
  try {
    const snap = await getDoc(doc(db, 'configuracion', 'general'));
    if (!snap.exists()) return;
    const c = snap.data();
    $('conf-whatsapp').value = c.whatsapp || '';
    setHomeWa(c.whatsapp || '50769969944');
    $('conf-instagram').value = c.instagram || '';
    $('conf-banner').value = c.banner_texto || '';
    $('conf-hero-title').value = c.hero_titulo || '';
    $('conf-hero-subtitle').value = c.hero_subtitulo || '';
    $('conf-hero-bg').value = c.hero_imagen_url || '';
    setHeroPreview(c.hero_imagen_url || null);
  } catch (e) { console.error(e); }
}
function setHeroPreview(src) {
  const ph = $('heroPh');
  if (src) { ph.style.backgroundImage = `url("${src}")`; ph.textContent = ''; }
  else { ph.style.backgroundImage = ''; ph.textContent = '🖼️'; }
}
async function saveConfig() {
  await withSpinner($('btn-save-config'), async () => {
    const data = {
      whatsapp: $('conf-whatsapp').value.trim(),
      instagram: $('conf-instagram').value.trim(),
      banner_texto: $('conf-banner').value.trim(),
      hero_titulo: $('conf-hero-title').value.trim(),
      hero_subtitulo: $('conf-hero-subtitle').value.trim(),
    };
    const heroUrl = $('conf-hero-bg').value.trim();
    if (heroUrl) data.hero_imagen_url = heroUrl;
    try { await setDoc(doc(db, 'configuracion', 'general'), data, { merge: true }); toast('✓ Datos del negocio guardados'); }
    catch (e) { console.error(e); toast('Error al guardar: ' + e.message); }
  });
}

/* ===== Stats ===== */
function updateStats() {
  $('st-prod').textContent = productos.length;
  $('st-vis').textContent = productos.filter(p => p.activo).length;
  $('st-res').textContent = opiniones.length;
}

/* ===== Inicio: lista de productos reales ===== */
function renderHomeRecent() {
  const el = $('homeRecent');
  if (!el) return;
  const items = productos.slice(0, 4);
  if (!items.length) {
    el.innerHTML = `<div class="empty" style="padding:24px 10px">Aún no hay productos. Toca “Agregar producto” arriba.</div>`;
    return;
  }
  el.innerHTML = items.map(p => {
    const ft = p.imagen_url
      ? `<div class="ft" style="background-image:url(&quot;${p.imagen_url}&quot;)"></div>`
      : `<div class="ft">🍗</div>`;
    const sub = `${esc(p.categoria || 'Sin categoría')}${p.activo ? '' : ' · oculto'}`;
    return `<button class="fr" type="button" onclick="openProd('${p.id}')">
      ${ft}
      <div class="fi"><div class="fn">${esc(p.titulo)}</div><div class="fd">${sub}</div></div>
      <span class="fp">${money(p.precio)}</span>
    </button>`;
  }).join('');
}

function setHomeWa(num) {
  const el = $('home-wa');
  if (el) el.textContent = num ? ('+' + String(num).replace(/^\+/, '')) : '—';
}

/* ===== Tema ===== */
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('mb-theme'); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  const toggleTheme = () => {
    const r = document.documentElement;
    const isDark = r.getAttribute('data-theme') === 'dark'
      || (!r.getAttribute('data-theme') && matchMedia('(prefers-color-scheme:dark)').matches);
    const next = isDark ? 'light' : 'dark';
    r.setAttribute('data-theme', next);
    try { localStorage.setItem('mb-theme', next); } catch (e) {}
  };
  document.querySelectorAll('.js-theme').forEach(b => b.addEventListener('click', toggleTheme));
}

/* ===== Cableado ===== */
function init() {
  initTheme();
  setHomeWa('50769969944'); // valor por defecto hasta que cargue la config
  // Botones guardar/eliminar
  $('saveProd').addEventListener('click', saveProd);
  $('delProd').addEventListener('click', deleteProd);
  $('savePromo').addEventListener('click', savePromo);
  $('delPromo').addEventListener('click', deletePromo);
  $('saveRes').addEventListener('click', saveRes);
  $('delRes').addEventListener('click', deleteRes);
  $('saveLoc').addEventListener('click', saveLoc);
  $('delLoc').addEventListener('click', deleteLoc);
  $('catSave').addEventListener('click', saveCat);
  $('catCancel').addEventListener('click', resetCatForm);
  $('btn-save-config').addEventListener('click', saveConfig);
  $('confirmOk').addEventListener('click', () => { const cb = confirmCb; closeSheet('confirmScrim'); if (cb) cb(); });

  // Foto por enlace (actualiza la vista previa al pegar la URL)
  $('fFotoUrl').addEventListener('input', () => setPvImage($('fFotoUrl').value.trim() || null, '🍗'));
  $('pFotoUrl').addEventListener('input', () => setPromoPreview($('pFotoUrl').value.trim() || null));
  $('conf-hero-bg').addEventListener('input', () => setHeroPreview($('conf-hero-bg').value.trim() || null));

  // Toggle "mostrar en la web"
  $('fSw').addEventListener('click', function () { this.classList.toggle('on'); this.setAttribute('aria-checked', this.classList.contains('on')); });

  // Vista previa en vivo
  ['fNombre', 'fPrecio', 'fDesc', 'fBadge'].forEach(id => $(id).addEventListener('input', syncPv));

  // Cerrar hoja tocando el fondo
  document.querySelectorAll('.scrim').forEach(s => s.addEventListener('click', e => { if (e.target === s) closeSheet(s.id); }));

  // Cargar datos
  loadCategorias();
  loadProductos();
  loadPromos();
  loadOpiniones();
  loadLocales();
  loadConfig();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

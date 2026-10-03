import { db } from './firebase.js';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Placeholder de marca para productos sin foto (o con enlace roto/caducado).
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='#bb0015'/><text x='300' y='186' font-family='Arial,Helvetica,sans-serif' font-size='46' font-weight='bold' fill='#f6b400' text-anchor='middle'>MIAMI BRO'S</text><text x='300' y='230' font-family='Arial,Helvetica,sans-serif' font-size='19' fill='#ffffff' text-anchor='middle' opacity='0.85'>Foto próximamente</text></svg>"
);
// Si una imagen falla al cargar, mostramos el placeholder (evita imágenes rotas).
window.imgFallback = function (img) { img.onerror = null; img.src = PLACEHOLDER; };

// Número de WhatsApp por defecto (se puede sobreescribir desde el panel → Negocio).
const WHATSAPP_NUMERO = '50769969944';
window.MiamiBros = window.MiamiBros || {};
window.MiamiBros.whatsapp = WHATSAPP_NUMERO;

// Plantilla del mensaje de pedido por WhatsApp. Cambia aquí el texto y se aplica en todos lados.
function mensajePedido(item, cantidad = 1) {
  const precio = item.precioStr || ('$' + (item.precio ?? '') + ' USD');
  return (
    `¡Hola Miami Bro's! 🍗\n` +
    `Quiero hacer un pedido:\n\n` +
    `▪️ *${item.titulo}*\n` +
    `   Cantidad: ${cantidad}\n` +
    `   Precio: ${precio}\n\n` +
    `Para completar mi pedido:\n` +
    `📍 Dirección (calle, edificio, apto, referencia): \n` +
    `💳 Método de pago (Efectivo / Tarjeta / Yappy / ACH): \n` +
    `📝 Notas (opcional): \n\n` +
    `¡Gracias! Quedo atento(a) a la confirmación 🙌`
  );
}
window.mensajePedido = mensajePedido;

// Aplica el número a todos los enlaces wa.me existentes en la página (botones fijos del HTML).
function aplicarWhatsappLinks(num) {
  if (!num) return;
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    try {
      const url = new URL(link.href);
      url.pathname = `/${num}`;
      link.href = url.toString();
    } catch (e) { /* enlace inválido, lo ignoramos */ }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfiguracion();                      // puede sobreescribir el número desde config
  aplicarWhatsappLinks(window.MiamiBros.whatsapp); // botones fijos del HTML
  renderMenu();                                    // las tarjetas se construyen ya con el número
  renderOpiniones();
  renderLocales();
  renderPromociones();
});

// --- Carta (modal): abrir/cerrar + arreglar enlaces rotos #menu / #combos ---
window.openCarta = function () {
  const m = document.getElementById('menu-modal');
  if (!m) return;
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};
window.cerrarCarta = function () {
  const m = document.getElementById('menu-modal');
  if (!m) return;
  m.classList.add('hidden');
  document.body.style.overflow = 'auto';
};
// Los enlaces #menu y #combos no apuntan a ninguna sección: que abran la carta.
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href="#menu"], a[href="#combos"]');
  if (a) { e.preventDefault(); window.openCarta(); }
});
// Cerrar la carta con la tecla Esc.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.cerrarCarta();
});

async function loadConfiguracion() {
  try {
    const docSnap = await getDoc(doc(db, "configuracion", "general"));
    if (docSnap.exists()) {
      const config = docSnap.data();
      
      // Update Top Banner
      if (config.banner_texto) {
        const bannerEl = document.getElementById("top-banner-text");
        if (bannerEl) bannerEl.innerHTML = config.banner_texto;
      }
      
      // WhatsApp: si hay número en la configuración, sobreescribe el por defecto.
      if (config.whatsapp) {
        const cleanWa = config.whatsapp.replace(/\D/g, ''); // solo dígitos
        if (cleanWa) {
          window.MiamiBros = window.MiamiBros || {};
          window.MiamiBros.whatsapp = cleanWa;
        }
      }
      
      // Update Instagram links
      if (config.instagram) {
        const igLinks = document.querySelectorAll('a[href*="instagram.com"]');
        igLinks.forEach(link => {
          link.href = config.instagram;
        });
      }

      // Update Hero
      if (config.hero_titulo) {
        const titleEl = document.getElementById('hero-title');
        if (titleEl) titleEl.innerHTML = config.hero_titulo;
      }
      if (config.hero_subtitulo) {
        const subtitleEl = document.getElementById('hero-subtitle');
        if (subtitleEl) subtitleEl.innerHTML = config.hero_subtitulo;
      }
      if (config.hero_imagen_url) {
        const bgEl = document.getElementById('hero-bg-image');
        if (bgEl) bgEl.src = config.hero_imagen_url;
      }
    }
  } catch (error) {
    console.error("Error cargando configuración global:", error);
  }
}

function buildCardHTML(item) {
  return `
    <div id="product-${item.id}" class="bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
      <div class="relative overflow-hidden">
        <img
          alt="${item.titulo}"
          class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          src="${item.imagen_url || PLACEHOLDER}"
          onerror="imgFallback(this)"
        />
        ${item.insignia ? `
        <span class="absolute top-3 left-3 ${item.insignia_color} font-label-sm text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
          ${item.insignia}
        </span>
        ` : ''}
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <h3 class="font-headline-sm text-lg font-bold text-on-surface mb-1 leading-tight">
          ${item.titulo}
        </h3>
        <p class="font-body-sm text-xs text-on-surface-variant mb-4 line-clamp-3">
          ${item.descripcion}
        </p>
        <div class="pt-3 border-t border-surface-container-high flex flex-col items-center justify-between gap-3 mt-auto">
          <span class="font-headline-sm text-xl text-primary font-black text-center">
            ${item.precioStr || '$' + item.precio + ' USD'}
          </span>
          <div class="flex flex-wrap items-center justify-center gap-2 w-full">
            <div class="flex items-center border border-surface-container-high rounded-full px-2 py-0.5 bg-surface-container-low shadow-inner">
              <button
                class="font-black px-2 text-on-surface-variant hover:text-primary active:scale-90 transition-transform"
                type="button"
                onclick="updateQuantity('${item.id}', 'modal', -1)"
              >
                -
              </button>
              <span id="qty-modal-${item.id}" class="font-label-sm px-2 font-black">1</span>
              <button
                class="font-black px-2 text-on-surface-variant hover:text-primary active:scale-90 transition-transform"
                type="button"
                onclick="updateQuantity('${item.id}', 'modal', 1)"
              >
                +
              </button>
            </div>
            <div class="flex gap-2">
              <a
                id="wa-link-modal-${item.id}"
                class="inline-flex items-center justify-center bg-[#25D366] text-white hover:bg-[#20ba59] font-label-sm text-xs px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all active:translate-y-0.5"
                href="https://wa.me/${window.MiamiBros.whatsapp || ''}?text=${encodeURIComponent(mensajePedido(item, 1))}"
                target="_blank"
                title="Pedir por WhatsApp"
              >
                <span class="material-symbols-outlined text-base">chat</span>
              </a>
              ${item.link_pedidos_ya ? `
              <a
                class="inline-flex items-center gap-1.5 bg-[#FA0050] text-white hover:bg-[#d60043] px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all active:translate-y-0.5"
                href="${item.link_pedidos_ya}"
                target="_blank"
                rel="noopener"
                title="Pedir por PedidosYa"
              >
                <span class="material-symbols-outlined text-base leading-none">two_wheeler</span>
                <span class="font-extrabold text-xs tracking-tight leading-none">PedidosYa</span>
              </a>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildFeaturedCardHTML(item) {
  return `
    <div class="relative bg-[#bb0015] rounded-3xl shadow-xl overflow-hidden group flex flex-col cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-[#a00010]">
      
        <!-- Top Image Area -->
      <div class="relative w-full h-56 sm:h-64 overflow-hidden bg-surface-container">
        <img src="${item.imagen_url || PLACEHOLDER}" onerror="imgFallback(this)" alt="${item.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 bg-amber-400 text-[#5e4200] font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider z-10">
          <span class="material-symbols-outlined text-[14px]">star</span> DESTACADO
        </div>
        ${item.insignia ? `<div class="absolute top-3 right-3 ${item.insignia_color} font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider z-10">${item.insignia}</div>` : ''}
      </div>
      
        <!-- Bottom Content Area -->
      <div class="p-6 sm:p-7 flex flex-col flex-1">
        <h3 class="text-amber-400 font-black text-2xl sm:text-3xl mb-3 line-clamp-2 uppercase tracking-tight leading-tight drop-shadow-sm min-h-[3rem]">
          ${item.titulo}
        </h3>
        <p class="text-white/90 text-sm line-clamp-2 mb-6 flex-1 font-medium">
          ${item.descripcion}
        </p>
        
        <div class="mt-auto pt-4 border-t border-white/20">
          <div class="flex items-center justify-between mb-5">
            <span class="text-white/80 font-black uppercase tracking-widest text-[10px] bg-black/20 px-3 py-1 rounded-full">Precio</span>
            <span class="text-white font-black text-3xl sm:text-4xl leading-none drop-shadow-lg">
              ${item.precioStr || '$' + item.precio}
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-3 w-full relative z-20">
            <button onclick="openMenuAndScrollTo('${item.id}')" type="button" class="flex items-center justify-center gap-1.5 text-white border-2 border-white/30 hover:border-white hover:bg-white/10 font-black text-xs py-3.5 px-2 rounded-2xl transition-all uppercase tracking-wider active:scale-95 shadow-sm hover:shadow-md">
              <span class="material-symbols-outlined text-[18px]">menu_book</span>
              VER EN MENÚ
            </button>
            <a href="https://wa.me/${window.MiamiBros.whatsapp || ''}?text=${encodeURIComponent(mensajePedido(item, 1))}" target="_blank" class="flex items-center justify-center gap-1.5 bg-amber-400 text-[#5e4200] hover:bg-white hover:text-primary font-black text-xs py-3.5 px-2 rounded-2xl shadow-[0_5px_20px_rgba(251,191,36,0.35)] hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)] transition-all active:scale-95 uppercase tracking-wider">
              <span class="material-symbols-outlined text-[18px]">bolt</span>
              PÍDELO YA
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderMenu() {
  const container = document.getElementById("menu-container");
  const featuredContainer = document.getElementById("featured-container");
  
  if (!container) return;

  container.innerHTML = `<div class="col-span-full text-center py-10"><span class="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span><p class="mt-2 text-on-surface-variant">Cargando menú delicioso...</p></div>`;
  if (featuredContainer) {
    featuredContainer.innerHTML = `<div class="col-span-full text-center py-10"><span class="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span></div>`;
  }

  try {
    const [querySnapshot, catSnapshot] = await Promise.all([
      getDocs(query(collection(db, "productos"), orderBy("orden"))),
      getDocs(query(collection(db, "categorias"), orderBy("orden")))
    ]);
    
    const dbCategories = [];
    catSnapshot.forEach(doc => dbCategories.push(doc.data().nombre));
    
    // Store items globally for the updateQuantity function to access
    window.MiamiBros = window.MiamiBros || {};
    window.MiamiBros.menuItems = [];
    
    container.innerHTML = ""; // Clear loader
    if (featuredContainer) featuredContainer.innerHTML = "";
    
    if (querySnapshot.empty) {
      container.innerHTML = `<div class="col-span-full text-center py-10 text-on-surface-variant font-bold">No hay productos disponibles por el momento.</div>`;
      if (featuredContainer) featuredContainer.innerHTML = `<div class="col-span-full text-center py-10 text-on-surface-variant font-bold">No hay productos destacados.</div>`;
      return;
    }

    let activeItemsCount = 0;
    const activeItems = [];

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      item.id = doc.id; // Store document id
      if (item.activo) {
        activeItems.push(item);
        window.MiamiBros.menuItems.push(item);
        
        // Append first 3 active items to featured section
        if (featuredContainer && activeItemsCount < 3) {
            const itemFeatHTML = buildFeaturedCardHTML(item);
            featuredContainer.insertAdjacentHTML("beforeend", itemFeatHTML);
            activeItemsCount++;
        }
      }
    });

    // Categorize items
    const categorize = (item) => {
      if (item.categoria) return item.categoria;
      // Fallback for old items without a category
      const t = item.titulo.toLowerCase();
      if (t.includes('niño') || t.includes('kids') || t.includes('infantil')) return 'Menú para Niños';
      if (t.includes('combo') || t.includes('bucket') || t.includes('familiar') || t.includes('caja')) return 'Combos y Promociones';
      if (t.includes('burger') || t.includes('mario') || t.includes('luigi') || t.includes('sandwich') || t.includes('tender')) return 'Hamburguesas y Tenders';
      if (t.includes('pieza') || t.includes('presa') || t.includes('clásico')) return 'Pollo Clásico';
      return 'Especialidades y Extras';
    };

    const grouped = {};
    // Use DB categories if available, else fallback
    const catOrder = dbCategories.length > 0 ? dbCategories : ['Combos y Promociones', 'Hamburguesas y Tenders', 'Pollo Clásico', 'Menú para Niños', 'Especialidades y Extras'];
    catOrder.forEach(c => grouped[c] = []);

    activeItems.forEach(item => {
      const cat = categorize(item);
      if(!grouped[cat]) {
        grouped[cat] = [];
        if (!catOrder.includes(cat)) catOrder.push(cat); // Ensure dynamic categories are tracked
      }
      grouped[cat].push(item);
    });

    // Create a flat list of renderables (headers and items)
    const renderables = [];
    catOrder.forEach(category => {
      const items = grouped[category];
      if (items && items.length > 0) {
        renderables.push({ type: 'header', text: category });
        items.forEach(item => renderables.push({ type: 'item', data: item }));
      }
    });

    // Build pages (Max weight per page = 8. Header=2, Item=1)
    // 8 weight fits beautifully in a 2x2 or 2x3 book spread
    window.MiamiBros.pages = [];
    let currentPageItems = [];
    let currentWeight = 0;
    const MAX_WEIGHT = 8;

    renderables.forEach(r => {
      const weight = r.type === 'header' ? 2 : 1;
      // If adding this pushes us over the limit, save current page and start a new one
      if (currentWeight + weight > MAX_WEIGHT && currentPageItems.length > 0) {
        window.MiamiBros.pages.push(currentPageItems);
        currentPageItems = [];
        currentWeight = 0;
      }
      currentPageItems.push(r);
      currentWeight += weight;
    });
    if (currentPageItems.length > 0) {
      window.MiamiBros.pages.push(currentPageItems);
    }

    window.MiamiBros.currentPage = 0;
    renderBookPage('initial');

  } catch (error) {
    console.error("Error cargando el menú: ", error);
    container.innerHTML = `<div class="col-span-full text-center py-10 text-error font-bold">Error cargando el menú. Por favor intenta más tarde.</div>`;
    if (featuredContainer) featuredContainer.innerHTML = "";
  }
}

function renderBookPage(direction = 'initial') {
  const container = document.getElementById("menu-container");
  const controls = document.getElementById("book-controls");
  const pages = window.MiamiBros.pages;
  const currIdx = window.MiamiBros.currentPage;
  
  if (!pages || pages.length === 0) return;
  
  const pageItems = pages[currIdx];
  
  // Animation classes
  const outClass = direction === 'next' ? 'turn-out-next' : (direction === 'prev' ? 'turn-out-prev' : '');
  const inClass = direction === 'next' ? 'turn-in-next' : (direction === 'prev' ? 'turn-in-prev' : '');
  
  // Apply out animation if not initial
  if (outClass) {
    container.className = `grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-x-24 lg:gap-x-32 max-w-6xl mx-auto pb-4 relative z-20 ${outClass}`;
  }
  
  setTimeout(() => {
    container.innerHTML = "";
    
    pageItems.forEach(r => {
      if (r.type === 'header') {
        container.insertAdjacentHTML("beforeend", `
          <div class="col-span-full text-center mt-2 mb-2">
            <h3 class="font-display-md text-3xl md:text-4xl text-[#8b1014] font-black uppercase tracking-widest border-b-2 border-[#8b1014]/30 pb-2 inline-block">${r.text}</h3>
          </div>
        `);
      } else {
        container.insertAdjacentHTML("beforeend", buildCardHTML(r.data));
      }
    });
    
    // Apply in animation
    if (inClass) {
      container.className = `grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-x-24 lg:gap-x-32 max-w-6xl mx-auto pb-4 relative z-20 ${inClass}`;
    }
    
    // Update Controls
    if (controls) {
      controls.classList.remove('hidden');
      document.getElementById('page-indicator').innerText = `Pág. ${currIdx + 1} / ${pages.length}`;
      document.getElementById('btn-prev-page').disabled = currIdx === 0;
      document.getElementById('btn-next-page').disabled = currIdx === pages.length - 1;
    }
  }, direction === 'initial' ? 0 : 400); // 400ms matches the CSS animation duration
}

// Bind pagination controls
document.addEventListener('DOMContentLoaded', () => {
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (window.MiamiBros.currentPage > 0) {
        window.MiamiBros.currentPage--;
        renderBookPage('prev');
      }
    });
  }
  
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (window.MiamiBros.currentPage < window.MiamiBros.pages.length - 1) {
        window.MiamiBros.currentPage++;
        renderBookPage('next');
      }
    });
  }
});

// Global function to handle quantity updates
window.updateQuantity = function (itemId, source, change) {
  const qtySpan = document.getElementById(`qty-${source}-${itemId}`);
  if (!qtySpan) return;

  let currentQty = parseInt(qtySpan.innerText, 10);
  let newQty = currentQty + change;
  if (newQty < 1) newQty = 1; // Min quantity is 1
  qtySpan.innerText = newQty;

  const item = window.MiamiBros.menuItems.find((i) => i.id === itemId);
  if (item) {
    const waLink = document.getElementById(`wa-link-${source}-${itemId}`);
    if (waLink) {
      const message = mensajePedido(item, newQty);
      const phoneNumber = window.MiamiBros.whatsapp ? `/${window.MiamiBros.whatsapp}` : '';
      waLink.href = `https://wa.me${phoneNumber}?text=${encodeURIComponent(message)}`;
    }
  }
};

window.openMenuAndScrollTo = function(productId) {
  const modal = document.getElementById('menu-modal');
  if (!modal) return;
  
  // Find which page contains this product and turn to it
  if (window.MiamiBros && window.MiamiBros.pages) {
    let targetPageIndex = 0;
    for (let i = 0; i < window.MiamiBros.pages.length; i++) {
      // Find item in the flat renderables array for this page
      const found = window.MiamiBros.pages[i].find(r => r.type === 'item' && r.data && r.data.id === productId);
      if (found) {
        targetPageIndex = i;
        break;
      }
    }
    if (window.MiamiBros.currentPage !== targetPageIndex) {
       window.MiamiBros.currentPage = targetPageIndex;
       // Since renderBookPage has a 300ms fade delay, we call it immediately
       renderBookPage();
    }
  }

  // Open modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // Wait for modal animation (and potential page render) before scrolling
  setTimeout(() => {
    const productEl = document.getElementById(`product-${productId}`);
    if (productEl) {
      // Scroll slightly above center to account for modal header
      productEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight animation
      productEl.classList.add('border-primary', 'shadow-[0_0_40px_rgba(187,0,21,0.3)]', 'scale-[1.02]', 'z-10');
      setTimeout(() => {
        productEl.classList.remove('border-primary', 'shadow-[0_0_40px_rgba(187,0,21,0.3)]', 'scale-[1.02]', 'z-10');
      }, 2000);
    }
  }, 400); // 400ms ensures renderBookPage's 300ms timeout has finished
};

// ==============================
// RENDER OPINIONES & LOCALES
// ==============================
async function renderLocales() {
  const container = document.getElementById('locales-container');
  if (!container) return;
  
  try {
      const q = query(collection(db, 'locales'), orderBy('orden'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
          container.innerHTML = '<p class="text-on-surface-variant font-body-sm">No hay locales registrados.</p>';
          return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
          const loc = docSnap.data();
          
          html += `
              <div class="mb-4">
                  <p class="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-base">storefront</span>
                      ${loc.nombre}
                      ${loc.mapa ? `<a href="${loc.mapa}" target="_blank" class="text-secondary hover:underline ml-2 text-xs font-bold">(Ver mapa)</a>` : ''}
                  </p>
                  ${loc.direccion ? `<p class="font-body-sm text-body-sm text-on-surface-variant italic mb-1">${loc.direccion}</p>` : ''}
                  <p class="font-body-sm text-body-sm text-on-surface">${loc.horario}</p>
              </div>
          `;
      });
      
      container.innerHTML = html;
  } catch (e) {
      console.error('Error loading locales', e);
  }
}

async function renderOpiniones() {
  const container = document.getElementById('opiniones-container');
  if (!container) return;
  
  try {
      const q = query(collection(db, 'opiniones'), orderBy('orden'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
          container.innerHTML = '<div class="col-span-full text-center p-6 text-on-surface-variant">Aún no hay opiniones.</div>';
          return;
      }

      let html = '';
      const bgColors = [
          'bg-primary/10 text-primary',
          'bg-secondary-container/30 text-secondary',
          'bg-tertiary-container/20 text-tertiary'
      ];

      let i = 0;
      querySnapshot.forEach((docSnap) => {
          const op = docSnap.data();
          
          // Generate initials
          const names = op.nombre.split(' ');
          let initials = names[0].charAt(0).toUpperCase();
          if(names.length > 1) {
              initials += names[1].charAt(0).toUpperCase();
          }

          const bgColor = bgColors[i % bgColors.length];
          i++;

          let stars = '';
          for(let s=0; s<op.estrellas; s++){
              stars += '<span class="material-symbols-outlined text-lg fill-1">star</span>';
          }

          html += `
              <div class="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm flex flex-col justify-between">
                  <div class="space-y-3">
                      <div class="flex text-amber-500 gap-1">
                          ${stars}
                      </div>
                      <p class="font-body-md text-on-surface italic">
                          "${op.comentario}"
                      </p>
                  </div>
                  <div class="pt-4 border-t border-surface-container mt-6 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full ${bgColor} font-black flex items-center justify-center font-label-md">
                          ${initials}
                      </div>
                      <div>
                          <p class="font-label-md font-bold text-on-surface leading-none">
                              ${op.nombre}
                          </p>
                          <span class="font-body-sm text-xs text-on-surface-variant">Cliente Miami Bro's</span>
                      </div>
                  </div>
              </div>
          `;
      });
      
      container.innerHTML = html;
  } catch (e) {
      console.error('Error loading opiniones', e);
  }
}


async function renderPromociones() {
  const container = document.getElementById('promociones-container');
  if (!container) return;
  
  try {
      const q = query(collection(db, 'promociones'), orderBy('orden'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
          container.innerHTML = '<div class="col-span-full text-center p-6 text-on-surface-variant">No hay promociones activas.</div>';
          return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
          const p = docSnap.data();
          
          html += `
              <div class="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container-high shadow-md hover:shadow-xl transition-all group flex flex-col">
                  <div class="relative overflow-hidden aspect-[4/5]">
                      <img alt="${p.titulo}"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src="${p.imagen}" />
                      <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
                          ${p.etiqueta ? `<span class="text-xs font-black uppercase text-amber-400 block">${p.etiqueta}</span>` : ''}
                          <h4 class="font-headline-sm text-base font-bold">
                              ${p.titulo}
                          </h4>
                      </div>
                  </div>
                  <div class="p-4 flex-1 flex flex-col justify-between bg-surface-container-low">
                      <p class="font-body-sm text-xs text-on-surface-variant">
                          ${p.descripcion}
                      </p>
                      <span class="text-primary font-bold text-xs mt-2 block">@miamibross • Panamá</span>
                  </div>
              </div>
          `;
      });
      
      container.innerHTML = html;
  } catch (e) {
      console.error('Error loading promociones', e);
  }
}

import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
});

async function renderMenu() {
  const container = document.getElementById("menu-container");
  if (!container) return;

  container.innerHTML = `<div class="col-span-full text-center py-10"><span class="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span><p class="mt-2 text-on-surface-variant">Cargando menú delicioso...</p></div>`;

  try {
    const q = query(collection(db, "productos"), orderBy("orden"));
    const querySnapshot = await getDocs(q);
    
    // Store items globally for the updateQuantity function to access
    window.MiamiBros = window.MiamiBros || {};
    window.MiamiBros.menuItems = [];
    
    container.innerHTML = ""; // Clear loader
    
    if (querySnapshot.empty) {
      container.innerHTML = `<div class="col-span-full text-center py-10 text-on-surface-variant font-bold">No hay productos disponibles por el momento.</div>`;
      return;
    }

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      item.id = doc.id; // Store document id
      
      if (item.activo) {
        window.MiamiBros.menuItems.push(item);
        
        // Generate the HTML for each item
        const itemHTML = `
          <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div class="relative overflow-hidden">
              <img
                alt="${item.titulo}"
                class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                src="${item.imagen_url}"
              />
              <span class="absolute top-3 left-3 ${item.insignia_color} font-label-sm text-label-sm font-bold px-3 py-1 rounded-full shadow-sm">
                ${item.insignia}
              </span>
            </div>
            <div class="p-space-md flex-1 flex flex-col justify-between">
              <h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">
                ${item.titulo}
              </h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">
                ${item.descripcion}
              </p>
                <div class="pt-space-sm border-t border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
                <span class="font-headline-sm text-headline-sm text-primary font-extrabold w-full md:w-auto text-center md:text-left">
                  ${item.precioStr || '$' + item.precio + ' USD'}
                </span>
                <div class="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                  <div class="flex items-center border border-surface-container-high rounded-full px-2 py-0.5 bg-surface-container-low">
                    <button
                      class="font-bold px-1 text-on-surface-variant hover:text-primary"
                      type="button"
                      onclick="updateQuantity('${item.id}', -1)"
                    >
                      -
                    </button>
                    <span id="qty-${item.id}" class="font-label-sm px-2 font-bold">1</span>
                    <button
                      class="font-bold px-1 text-on-surface-variant hover:text-primary"
                      type="button"
                      onclick="updateQuantity('${item.id}', 1)"
                    >
                      +
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <a
                      id="wa-link-${item.id}"
                      class="inline-flex items-center gap-1 bg-[#25D366] text-white hover:bg-[#20ba59] font-label-sm text-label-sm px-3 py-1.5 rounded-full shadow-sm transition-all"
                      href="https://wa.me/?text=${encodeURIComponent(item.mensaje_wa + " (Cantidad: 1)")}"
                      target="_blank"
                      title="Pedir por WhatsApp"
                    >
                      <span class="material-symbols-outlined text-sm">chat</span>
                    </a>
                    ${item.link_pedidos_ya ? `
                    <a
                      class="inline-flex items-center justify-center bg-[#FF004D] text-white hover:bg-[#d60040] font-label-sm text-label-sm px-3 py-1.5 rounded-full shadow-sm transition-all"
                      href="${item.link_pedidos_ya}"
                      target="_blank"
                      title="Pedir por PedidosYa"
                    >
                      <img src="https://images.deliveryhero.io/image/pedidosya/peya_logo.png" alt="PedidosYa" class="h-4 object-contain">
                    </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHTML);
      }
    });
  } catch (error) {
    console.error("Error cargando el menú: ", error);
    container.innerHTML = `<div class="col-span-full text-center py-10 text-error font-bold">Error cargando el menú. Por favor intenta más tarde.</div>`;
  }
}

// Global function to handle quantity updates
window.updateQuantity = function (itemId, change) {
  const qtySpan = document.getElementById(`qty-${itemId}`);
  if (!qtySpan) return;

  let currentQty = parseInt(qtySpan.innerText, 10);
  let newQty = currentQty + change;
  if (newQty < 1) newQty = 1; // Min quantity is 1

  qtySpan.innerText = newQty;

  // Update WhatsApp Link
  const item = window.MiamiBros.menuItems.find((i) => i.id === itemId);
  if (item) {
    const waLink = document.getElementById(`wa-link-${itemId}`);
    if (waLink) {
      const message = `${item.mensaje_wa} (Cantidad: ${newQty})`;
      waLink.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }
  }
};

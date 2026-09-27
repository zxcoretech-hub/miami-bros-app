document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
});

function renderMenu() {
  const container = document.getElementById("menu-container");
  if (!container) return;

  // Read data from window.MiamiBros (loaded from data.js)
  const menuItems = window.MiamiBros?.menuItems || [];

  container.innerHTML = ""; // Clear loader if any

  menuItems.forEach((item) => {
    // Generate the HTML for each item
    const itemHTML = `
      <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
        <div class="relative overflow-hidden">
          <img
            alt="${item.title}"
            class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            src="${item.image}"
          />
          <span class="absolute top-3 left-3 ${item.badgeClass} font-label-sm text-label-sm font-bold px-3 py-1 rounded-full shadow-sm">
            ${item.badge}
          </span>
        </div>
        <div class="p-space-md flex-1 flex flex-col justify-between">
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">
            ${item.title}
          </h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">
            ${item.description}
          </p>
          <div class="pt-space-sm border-t border-surface-container-high flex items-center justify-between mt-auto">
            <span class="font-headline-sm text-headline-sm text-primary font-extrabold">
              ${item.priceStr}
            </span>
            <div class="flex items-center gap-2">
              <div class="flex items-center border border-surface-container-high rounded-full px-2 py-0.5 bg-surface-container-low">
                <button
                  class="font-bold px-1 text-on-surface-variant hover:text-primary"
                  type="button"
                  onclick="updateQuantity(${item.id}, -1)"
                >
                  -
                </button>
                <span id="qty-${item.id}" class="font-label-sm px-2 font-bold">1</span>
                <button
                  class="font-bold px-1 text-on-surface-variant hover:text-primary"
                  type="button"
                  onclick="updateQuantity(${item.id}, 1)"
                >
                  +
                </button>
              </div>
              <a
                id="wa-link-${item.id}"
                class="inline-flex items-center gap-1 bg-[#25D366] text-white hover:bg-[#20ba59] font-label-sm text-label-sm px-3 py-1.5 rounded-full shadow-sm transition-all"
                href="https://wa.me/?text=${encodeURIComponent(item.waMessage + " (Cantidad: 1)")}"
                target="_blank"
              >
                <span class="material-symbols-outlined text-sm">chat</span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert into container
    container.insertAdjacentHTML("beforeend", itemHTML);
  });
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
      const message = `${item.waMessage} (Cantidad: ${newQty})`;
      waLink.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }
  }
};

import { db, storage } from './firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';

let currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupModal();
});

// Load products from Firestore
async function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    try {
        const q = query(collection(db, "productos"), orderBy("orden"));
        const querySnapshot = await getDocs(q);
        
        currentProducts = [];
        tableBody.innerHTML = ''; // Clear table
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-on-surface-variant font-bold">No hay productos. ¡Agrega uno nuevo!</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            item.id = doc.id;
            currentProducts.push(item);
            
            // Build Table Row
            const row = document.createElement('tr');
            row.className = 'border-b border-surface-container hover:bg-surface-container-low transition-colors';
            
            const statusBadge = item.activo 
                ? '<span class="bg-[#25D366]/20 text-[#25D366] px-3 py-1 rounded-full text-xs font-bold">Activo</span>'
                : '<span class="bg-error-container text-error px-3 py-1 rounded-full text-xs font-bold">Oculto</span>';
            
            const insigniaHTML = item.insignia 
                ? `<span class="${item.insignia_color} px-2 py-0.5 rounded-full text-[10px] font-bold block w-max">${item.insignia}</span>` 
                : '<span class="text-on-surface-variant text-xs">-</span>';

            row.innerHTML = `
                <td class="p-4 flex items-center gap-3">
                    <img src="${item.imagen_url}" alt="${item.titulo}" class="w-12 h-12 object-cover rounded-lg border border-surface-container" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                    <div>
                        <p class="font-bold text-on-surface">${item.titulo}</p>
                        <p class="text-xs text-on-surface-variant truncate w-48" title="${item.descripcion}">${item.descripcion}</p>
                    </div>
                </td>
                <td class="p-4 font-bold text-on-surface">${item.precioStr || '$' + item.precio + ' USD'}</td>
                <td class="p-4">${insigniaHTML}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editProduct('${item.id}')" class="text-primary hover:bg-primary-container p-2 rounded-lg transition-colors" title="Editar">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="deleteProduct('${item.id}')" class="text-error hover:bg-error-container p-2 rounded-lg transition-colors" title="Eliminar">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-error font-bold">Error al cargar datos. Verifica la consola.</td></tr>`;
    }
}

// Modal Logic
function setupModal() {
    const modal = document.getElementById('product-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const btnAdd = document.getElementById('btn-add-product');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('product-form');

    const openModal = () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        form.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-old-image').value = '';
        document.getElementById('img-preview').classList.add('hidden');
    };

    btnAdd.addEventListener('click', () => {
        document.getElementById('modal-title').innerText = 'Nuevo Producto';
        // Auto-increment order based on length
        document.getElementById('prod-orden').value = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.orden || 0)) + 1 : 1;
        document.getElementById('prod-activo').checked = true;
        openModal();
    });

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Form Submit Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById('btn-save-product');
        const originalBtnHTML = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Guardando...';

        try {
            const id = document.getElementById('prod-id').value || `prod-${Date.now()}`;
            const fileInput = document.getElementById('prod-imagen');
            let imageUrl = document.getElementById('prod-old-image').value;

            // Upload new image if selected
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const storageRef = ref(storage, `productos/${id}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Build Product Object
            const precio = parseFloat(document.getElementById('prod-precio').value);
            const productData = {
                titulo: document.getElementById('prod-titulo').value,
                descripcion: document.getElementById('prod-descripcion').value,
                precio: precio,
                precioStr: `$${precio.toFixed(2)} USD`,
                insignia: document.getElementById('prod-insignia').value,
                insignia_color: document.getElementById('prod-insignia-color').value,
                mensaje_wa: document.getElementById('prod-wa').value,
                link_pedidos_ya: document.getElementById('prod-pedidosya').value || "",
                imagen_url: imageUrl || "https://placehold.co/600x400?text=Sin+Imagen",
                activo: document.getElementById('prod-activo').checked,
                orden: parseInt(document.getElementById('prod-orden').value) || 1
            };

            // Save to Firestore
            await setDoc(doc(db, "productos", id), productData);
            
            closeModal();
            loadProducts(); // Refresh Table
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar el producto: " + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHTML;
        }
    });

    // Image Preview
    document.getElementById('prod-imagen').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('img-preview');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Global functions for inline HTML event handlers
window.editProduct = (id) => {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-title').innerText = 'Editar Producto';
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-titulo').value = product.titulo;
    document.getElementById('prod-precio').value = product.precio;
    document.getElementById('prod-insignia').value = product.insignia || '';
    document.getElementById('prod-insignia-color').value = product.insignia_color || 'bg-primary text-on-primary';
    document.getElementById('prod-descripcion').value = product.descripcion;
    document.getElementById('prod-wa').value = product.mensaje_wa || '';
    document.getElementById('prod-pedidosya').value = product.link_pedidos_ya || '';
    document.getElementById('prod-activo').checked = product.activo;
    document.getElementById('prod-orden').value = product.orden || 1;
    document.getElementById('prod-old-image').value = product.imagen_url;

    // Show preview of current image
    const preview = document.getElementById('img-preview');
    if (product.imagen_url) {
        preview.src = product.imagen_url;
        preview.classList.remove('hidden');
    }

    // Open Modal
    document.getElementById('product-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.deleteProduct = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
            loadProducts();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Hubo un error al eliminar el producto.");
        }
    }
};

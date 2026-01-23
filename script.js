// ===================== SISTEMA DEL CARRITO =====================
// Carrito almacenado en localStorage
let cart = JSON.parse(localStorage.getItem('vapextuc_cart')) || [];

// Elementos del DOM
const cartCountElement = document.querySelector('.cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPriceElement = document.getElementById('cart-total-price');
const cartModal = document.getElementById('cart-modal');
const closeModalBtn = document.querySelector('.close-modal');
const checkoutBtn = document.getElementById('checkout-btn');
const cartBtn = document.getElementById('cart-btn');

// ===================== FUNCIONES DEL CARRITO =====================

// Función para obtener precio del HTML
function getCurrentPrice(productElement) {
    // Primero intentar del texto visible (.product-price)
    const priceElement = productElement.querySelector('.product-price');
    if (priceElement) {
        const priceText = priceElement.textContent;
        // Extraer solo números (eliminar $, puntos, etc.)
        const price = parseInt(priceText.replace(/[^\d]/g, ''));
        if (!isNaN(price)) return price;
    }
    
    // Si no funciona, usar data-price
    return parseInt(productElement.dataset.price) || 0;
}

// Agregar producto al carrito - VERSIÓN CORREGIDA PARA CARRUSEL
function addToCart(productId) {
    console.log("addToCart llamado para producto:", productId);
    
    // Obtener el elemento del producto
    const productElement = document.querySelector(`.product-card[data-id="${productId}"]`);
    
    if (!productElement) {
        console.error("Producto no encontrado con id:", productId);
        showNotification('Producto no encontrado', 'error');
        return;
    }
    
    console.log("Elemento del producto encontrado:", productElement);
    
    // Extraer el SABOR del segundo feature-tag
    const featureTags = productElement.querySelectorAll('.feature-tag');
    let flavor = 'No especificado';
    
    // Buscar el feature-tag que contiene "Sabor"
    featureTags.forEach(tag => {
        const text = tag.textContent;
        if (text.includes('Sabor')) {
            // Extraer solo el nombre del sabor (eliminar "Sabor ")
            flavor = text.replace('Sabor', '').trim();
        }
    });
    
    // OBTENER LA IMAGEN DEL CARRUSEL - CORREGIDO
    let productImage = '';
    
    // Buscar en el carrusel de Vapex (nueva estructura)
    const vcContainer = productElement.querySelector('.vc-container');
    if (vcContainer) {
        // Buscar la primera imagen visible en el carrusel
        const visibleSlides = vcContainer.querySelectorAll('.vc-slide');
        let activeSlide = null;
        
        // Buscar slide visible
        for (const slide of visibleSlides) {
            const style = window.getComputedStyle(slide);
            if (style.display === 'flex' || style.display === 'block') {
                activeSlide = slide;
                break;
            }
        }
        
        // Si no se encontró visible, tomar el primero
        if (!activeSlide && visibleSlides.length > 0) {
            activeSlide = visibleSlides[0];
        }
        
        if (activeSlide) {
            const img = activeSlide.querySelector('img');
            if (img && img.src) {
                productImage = img.src;
            }
        }
    }
    
    // Si no se encontró en el carrusel Vapex, usar placeholder
    if (!productImage) {
        productImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRTBFMEUwIi8+PHRleHQgeD0iMTI1IiB5PSIxMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NjY2NiI+VmFwZXhUdWM8L3RleHQ+PHRleHQgeD0iMTI1IiB5PSIxNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSI+UHJvZHVjdG88L3RleHQ+PC9zdmc+';
    }
    
    // Extraer datos del producto CON PRECIO ACTUAL DEL HTML
    const productData = {
        id: productId,
        title: productElement.querySelector('.product-title').textContent,
        price: getCurrentPrice(productElement), // PRECIO ACTUAL
        category: productElement.dataset.category,
        image: productImage, // IMAGEN CORREGIDA
        stock: parseInt(productElement.dataset.stock) || 10,
        flavor: flavor
    };
    
    console.log("Datos del producto:", productData);
    
    // Buscar si ya existe en el carrito
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Verificar que no supere el stock
        if (existingItem.quantity >= productData.stock) {
            showNotification(`No hay más stock disponible. Máximo: ${productData.stock}`, 'error');
            return;
        }
        
        // ACTUALIZAR DATOS SI CAMBIARON (precio, sabor, etc.)
        existingItem.price = productData.price;
        existingItem.flavor = productData.flavor;
        existingItem.title = productData.title;
        
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...productData,
            quantity: 1
        });
    }
    
    // Actualizar interfaz
    updateCart();
    
    // Mostrar confirmación
    showNotification(`✓ ${productData.title} agregado al carrito`, 'success');
    
    // Abrir automáticamente el carrito después de 300ms
    setTimeout(() => {
        openCartModal();
    }, 300);
}

// Función para actualizar precios de todos los productos en el carrito
function updateCartPrices() {
    let updated = false;
    
    cart.forEach(item => {
        const productElement = document.querySelector(`.product-card[data-id="${item.id}"]`);
        if (productElement) {
            // Obtener precio actual del HTML
            const newPrice = getCurrentPrice(productElement);
            
            // Si el precio cambió, actualizar
            if (item.price !== newPrice) {
                item.price = newPrice;
                updated = true;
            }
            
            // También actualizar sabor si cambió
            const featureTags = productElement.querySelectorAll('.feature-tag');
            let newFlavor = 'No especificado';
            featureTags.forEach(tag => {
                const text = tag.textContent;
                if (text.includes('Sabor')) {
                    newFlavor = text.replace('Sabor', '').trim();
                }
            });
            
            if (item.flavor !== newFlavor) {
                item.flavor = newFlavor;
                updated = true;
            }
            
            // Actualizar imagen si cambió (por el carrusel)
            let newImage = '';
            const vcContainer = productElement.querySelector('.vc-container');
            if (vcContainer) {
                const visibleSlides = vcContainer.querySelectorAll('.vc-slide');
                let activeSlide = null;
                
                for (const slide of visibleSlides) {
                    const style = window.getComputedStyle(slide);
                    if (style.display === 'flex' || style.display === 'block') {
                        activeSlide = slide;
                        break;
                    }
                }
                
                if (!activeSlide && visibleSlides.length > 0) {
                    activeSlide = visibleSlides[0];
                }
                
                if (activeSlide) {
                    const img = activeSlide.querySelector('img');
                    if (img && img.src) {
                        newImage = img.src;
                    }
                }
            }
            
            if (newImage && item.image !== newImage) {
                item.image = newImage;
                updated = true;
            }
        }
    });
    
    if (updated) {
        console.log("Precios actualizados en el carrito");
        updateCart();
    }
}

// Remover producto del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification('Producto eliminado del carrito', 'info');
}

// Actualizar cantidad de producto
function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    // Obtener stock máximo del DOM
    const productElement = document.querySelector(`.product-card[data-id="${productId}"]`);
    const maxStock = productElement ? parseInt(productElement.dataset.stock) : 10;
    
    if (newQuantity > maxStock) {
        showNotification(`No hay suficiente stock. Máximo: ${maxStock}`, 'error');
        return;
    }
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        updateCart();
    }
}

// Actualizar todo el carrito
function updateCart() {
    // Actualizar precios antes de guardar
    updateCartPrices();
    
    // Guardar en localStorage
    localStorage.setItem('vapextuc_cart', JSON.stringify(cart));
    
    // Actualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    
    // Actualizar mini carrito
    updateMiniCart();
    
    // Actualizar modal si está abierto
    if (cartModal.style.display === 'block') {
        updateCartModal();
    }
}

// Actualizar mini carrito
function updateMiniCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        cartTotalPriceElement.textContent = '$0';
        return;
    }
    
    let itemsHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHTML += `
            <div class="cart-item-mini">
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.category} • $${item.price.toLocaleString('es-AR')} x ${item.quantity}</p>
                </div>
                <div class="cart-item-total">
                    <p>$${itemTotal.toLocaleString('es-AR')}</p>
                    <button onclick="removeFromCart(${item.id})" class="remove-item-mini">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = itemsHTML;
    cartTotalPriceElement.textContent = `$${total.toLocaleString('es-AR')}`;
}

// Abrir modal del carrito
function openCartModal() {
    updateCartModal();
    cartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal del carrito
function closeCartModal() {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Actualizar modal del carrito (SIN ENVÍO)
function updateCartModal() {
    const modalBody = document.getElementById('cart-modal-body');
    
    if (cart.length === 0) {
        modalBody.innerHTML = `
            <div class="empty-cart-modal">
                <i class="fas fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos para continuar</p>
                <button class="continue-shopping" onclick="closeCartModal()">Seguir comprando</button>
            </div>
        `;
        return;
    }
    
    let modalHTML = '<div class="cart-modal-items">';
    let total = 0;
    let totalItems = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;
        
        modalHTML += `
            <div class="cart-modal-item">
                <div class="cart-modal-item-image">
                    <img src="${item.image}" alt="${item.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2NjY2Ij5WYXBlPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="cart-modal-item-details">
                    <h4>${item.title}</h4>
                    <p class="item-category">${item.category}</p>
                    <p class="item-flavor">Sabor: ${item.flavor || 'No especificado'}</p>
                    <p class="item-price">$${item.price.toLocaleString('es-AR')} c/u</p>
                </div>
                <div class="cart-modal-item-quantity">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-modal-item-total">
                    <p>$${itemTotal.toLocaleString('es-AR')}</p>
                    <button onclick="removeFromCart(${item.id})" class="remove-item-modal">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    modalHTML += `
        </div>
        <div class="cart-modal-summary">
            <div class="summary-row total">
                <span><strong>TOTAL:</strong></span>
                <span><strong>$${total.toLocaleString('es-AR')}</strong></span>
            </div>
            <div class="modal-actions">
                <button class="continue-btn" onclick="closeCartModal()">
                    <i class="fas fa-arrow-left"></i> Seguir comprando
                </button>
                <button class="checkout-btn-modal" onclick="proceedToCheckout()">
                    <i class="fab fa-whatsapp"></i> Finalizar por WhatsApp
                </button>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = modalHTML;
}

// Proceder al checkout (WhatsApp)
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'error');
        return;
    }
    
    // Calcular total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Crear mensaje para WhatsApp
    const fecha = new Date().toLocaleDateString('es-AR');
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    
    let mensaje = `¡Hola VapexTuc! 👋\n\n`;
    mensaje += `*DETALLE DEL PEDIDO:*\n`;
    mensaje += `══════════════════════\n\n`;
    
    // Agregar cada producto CON SU SABOR
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        mensaje += `*${index + 1}. ${item.title}*\n`;
        mensaje += `   • Categoría: ${item.category}\n`;
        mensaje += `   • Sabor: ${item.flavor || 'No especificado'}\n`;
        mensaje += `   • Cantidad: ${item.quantity} unidad${item.quantity > 1 ? 'es' : ''}\n`;
        mensaje += `   • Precio: $${item.price.toLocaleString('es-AR')} c/u\n`;
        mensaje += `   • Subtotal: $${subtotal.toLocaleString('es-AR')}\n\n`;
    });
    
    mensaje += `══════════════════════\n`;
    mensaje += `*RESUMEN DE COMPRA:*\n\n`;
    mensaje += `📦 Total productos: ${cart.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    mensaje += `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-AR')}*\n\n`;
    mensaje += `_Pedido generado desde https://vapextuc.netlify.app_\n`;
    
    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroWhatsApp = '+5493813256714';
    
    // Crear URL de WhatsApp
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
    
    // Mostrar confirmación
    showNotification('Redirigiendo a WhatsApp...', 'success');
    
    // Abrir WhatsApp en nueva pestaña
    setTimeout(() => {
        window.open(urlWhatsApp, '_blank');
    }, 800);
}

// ===================== FUNCIONES UTILITARIAS =====================

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ===================== EVENT LISTENERS =====================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar carrito
    updateCart();
    
    // Eventos del carrito
    cartBtn.addEventListener('click', openCartModal);
    
    closeModalBtn.addEventListener('click', closeCartModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
    
    // Botón de checkout del mini carrito
    checkoutBtn.addEventListener('click', openCartModal);
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal.style.display === 'block') {
            closeCartModal();
        }
    });
    
    // Manejar imágenes que fallan al cargar
    handleBrokenImages();
    
    // *** ELIMINADO: setupButtonListeners() - Causaba que se agreguen 2 productos ***
});

// Manejar imágenes rotas
function handleBrokenImages() {
    const images = document.querySelectorAll('.vc-slide img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Crear placeholder SVG en base64
            const svgPlaceholder = 'data:image/svg+xml;base64,' + btoa(`
                <svg width="250" height="200" viewBox="0 0 250 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="250" height="200" fill="#F5F5F5"/>
                    <rect x="50" y="50" width="150" height="100" fill="#E0E0E0"/>
                    <text x="125" y="120" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">VapexTuc</text>
                    <text x="125" y="140" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Producto</text>
                </svg>
            `);
            this.src = svgPlaceholder;
        });
    });
}

// Función para vaciar el carrito (útil para testing)
function clearCart() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        cart = [];
        updateCart();
        showNotification('Carrito vaciado', 'info');
    }
}

// Función para simular compra rápida (para testing)
function quickBuy(productId, quantity = 1) {
    for (let i = 0; i < quantity; i++) {
        addToCart(productId);
    }
}

// ===================== CORRECCIÓN PARA CARRUSEL =====================
// Esto asegura que los botones funcionen incluso si hay problemas con el carrusel

// Sobreescribir el comportamiento de los botones si es necesario
function fixCarouselButtonIssues() {
    // Asegurar que todos los botones tengan z-index alto
    const allBuyButtons = document.querySelectorAll('.buy-btn');
    
    allBuyButtons.forEach(btn => {
        // Aplicar estilos inline para prioridad máxima
        btn.style.zIndex = '10000';
        btn.style.position = 'relative';
        btn.style.pointerEvents = 'auto';
    });
    
    // Asegurar que los elementos del carrusel no interfieran
    const carouselElements = document.querySelectorAll('.vc-container');
    
    carouselElements.forEach(container => {
        container.style.pointerEvents = 'none';
        
        // Permitir interacción solo en flechas e indicadores
        const arrows = container.querySelectorAll('.vc-arrow');
        const dots = container.querySelectorAll('.vc-dots label');
        
        arrows.forEach(arrow => arrow.style.pointerEvents = 'auto');
        dots.forEach(dot => dot.style.pointerEvents = 'auto');
    });
}

// Ejecutar la corrección después de que la página cargue completamente
window.addEventListener('load', fixCarouselButtonIssues);
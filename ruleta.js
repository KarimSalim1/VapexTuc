// ruleta.js - Sistema completo de ruleta con autenticación y probabilidades

document.addEventListener('DOMContentLoaded', function() {
    // Configuración de premios y probabilidades
    const PREMIOS_RUELETA = [
        { nombre: "Sin recompensa", icono: "🎁", probabilidad: 80.0, descripcion: "Intenta de nuevo en 3 días" },
        { nombre: "Envío gratis", icono: "🚚", probabilidad: 7.5, descripcion: "Próximo envío gratuito" },
        { nombre: "5% descuento", icono: "💰", probabilidad: 7.5, descripcion: "5% de descuento en tu próxima compra" },
        { nombre: "10% descuento", icono: "💵", probabilidad: 5.0, descripcion: "10% de descuento en tu próxima compra" }
    ];
    
    // Premios para mostrar en la lista (incluyendo los decorativos)
    const PREMIOS_LISTA = [
        { nombre: "Sin recompensa", icono: "🎁" },
        { nombre: "Envío gratis", icono: "🚚" },
        { nombre: "5% descuento", icono: "💰" },
        { nombre: "10% descuento", icono: "💵" },
        { nombre: "25% descuento", icono: "💎" },
        { nombre: "50% descuento", icono: "👑" },
        { nombre: "100% descuento", icono: "🏆" }
    ];

    // Variables globales
    let currentUser = null;
    let isSpinning = false;
    let wheelSpinning = false;
    let wheelCanvas = null;
    let wheelCtx = null;
    let canvasSize = 500; // Tamaño base del canvas

    // Elementos DOM
    const elements = {
        // Autenticación
        ruletaSessionBar: document.getElementById('ruletaSessionBar'),
        ruletaUserName: document.getElementById('ruletaUserName'),
        ruletaLoginOpen: document.getElementById('ruletaLoginOpen'),
        ruletaLogout: document.getElementById('ruletaLogout'),
        ruletaAuthModal: document.getElementById('ruletaAuthModal'),
        ruletaCloseModal: document.getElementById('ruletaCloseModal'),
        
        // Formularios login/register
        ruletaLoginForm: document.getElementById('ruletaLoginForm'),
        ruletaRegisterForm: document.getElementById('ruletaRegisterForm'),
        ruletaSwitchToRegister: document.getElementById('ruletaSwitchToRegister'),
        ruletaSwitchToLogin: document.getElementById('ruletaSwitchToLogin'),
        
        // Campos formularios
        ruletaLoginEmail: document.getElementById('ruletaLoginEmail'),
        ruletaLoginPassword: document.getElementById('ruletaLoginPassword'),
        ruletaRegisterName: document.getElementById('ruletaRegisterName'),
        ruletaRegisterEmail: document.getElementById('ruletaRegisterEmail'),
        ruletaRegisterPassword: document.getElementById('ruletaRegisterPassword'),
        
        // Botones formularios
        ruletaLoginBtn: document.getElementById('ruletaLoginBtn'),
        ruletaRegisterBtn: document.getElementById('ruletaRegisterBtn'),
        
        // Ruleta
        spinBtn: document.getElementById('spinBtn'),
        wheelCanvas: document.getElementById('wheelCanvas'),
        ruletaWrapper: document.querySelector('.ruleta-wrapper'),
        
        // Información de tiempo
        nextSpinInfo: document.getElementById('nextSpinInfo'),
        remainingTime: document.getElementById('remainingTime'),
        
        // Modal resultado
        ruletaResultModal: document.getElementById('ruletaResultModal'),
        prizeWon: document.getElementById('prizeWon'),
        prizeDescription: document.getElementById('prizeDescription'),
        closeResult: document.getElementById('closeResult')
    };

    // Inicialización
    function init() {
        loadUsersFromStorage();
        loadCurrentUser();
        setupCanvas();
        setupEventListeners();
        updateSpinButton();
        updateSessionBar();
        checkSpinAvailability();
        
        // Redibujar en resize
        window.addEventListener('resize', setupCanvas);
    }

    // Configurar canvas según el tamaño de pantalla
    function setupCanvas() {
        // Obtener el tamaño del contenedor
        const wrapperRect = elements.ruletaWrapper.getBoundingClientRect();
        canvasSize = Math.min(wrapperRect.width, wrapperRect.height);
        
        // Configurar canvas
        wheelCanvas = elements.wheelCanvas;
        wheelCtx = wheelCanvas.getContext('2d');
        
        // Establecer tamaño del canvas
        wheelCanvas.width = canvasSize;
        wheelCanvas.height = canvasSize;
        
        // Actualizar CSS para mantener proporción
        wheelCanvas.style.width = canvasSize + 'px';
        wheelCanvas.style.height = canvasSize + 'px';
        
        // Dibujar ruleta inicial
        drawWheel();
    }

    // Cargar usuarios desde localStorage
    function loadUsersFromStorage() {
        if (!localStorage.getItem('ruletaUsers')) {
            localStorage.setItem('ruletaUsers', JSON.stringify([]));
        }
    }

    // Cargar usuario actual desde localStorage
    function loadCurrentUser() {
        const userData = localStorage.getItem('ruletaCurrentUser');
        if (userData) {
            currentUser = JSON.parse(userData);
            
            // Verificar si el usuario aún existe en la base de datos
            const users = JSON.parse(localStorage.getItem('ruletaUsers'));
            const userExists = users.some(user => user.email === currentUser.email);
            
            if (!userExists) {
                logout();
                return;
            }
            
            // Actualizar datos del usuario desde la base
            const updatedUser = users.find(user => user.email === currentUser.email);
            if (updatedUser) {
                currentUser = updatedUser;
                saveCurrentUser();
            }
        }
    }

    // Guardar usuario actual
    function saveCurrentUser() {
        if (currentUser) {
            localStorage.setItem('ruletaCurrentUser', JSON.stringify(currentUser));
            
            // Actualizar también en la lista de usuarios
            const users = JSON.parse(localStorage.getItem('ruletaUsers'));
            const userIndex = users.findIndex(user => user.email === currentUser.email);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('ruletaUsers', JSON.stringify(users));
            }
        }
    }

    // Dibujar la ruleta
    function drawWheel(rotation = 0) {
        if (!wheelCtx) return;
        
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        // Limpiar canvas
        wheelCtx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Calcular la suma total de probabilidades
        const totalProbability = PREMIOS_RUELETA.reduce((sum, premio) => sum + premio.probabilidad, 0);
        
        // Colores para cada segmento
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
        
        // Dibujar cada segmento
        let startAngle = rotation;
        
        PREMIOS_RUELETA.forEach((premio, index) => {
            // Calcular el ángulo del segmento basado en su probabilidad
            const sliceAngle = (2 * Math.PI * premio.probabilidad) / totalProbability;
            const endAngle = startAngle + sliceAngle;
            
            // Dibujar segmento
            wheelCtx.beginPath();
            wheelCtx.moveTo(centerX, centerY);
            wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            wheelCtx.closePath();
            
            // Rellenar segmento
            wheelCtx.fillStyle = colors[index % colors.length];
            wheelCtx.fill();
            
            // Borde del segmento
            wheelCtx.strokeStyle = '#ffffff';
            wheelCtx.lineWidth = 2;
            wheelCtx.stroke();
            
            // Dibujar texto en el segmento (solo si hay espacio suficiente)
            if (canvasSize >= 300) { // Solo mostrar texto en pantallas grandes
                wheelCtx.save();
                wheelCtx.translate(centerX, centerY);
                wheelCtx.rotate(startAngle + sliceAngle / 2);
                wheelCtx.textAlign = 'right';
                wheelCtx.fillStyle = '#ffffff';
                
                // Ajustar tamaño de fuente según el canvas
                const fontSize = Math.max(12, canvasSize / 30);
                wheelCtx.font = `bold ${fontSize}px Arial`;
                
                // Acortar texto si es necesario
                let text = premio.nombre;
                if (canvasSize < 400 && text.length > 10) {
                    text = text.substring(0, 8) + '...';
                }
                
                wheelCtx.fillText(text, radius - 20, 5);
                wheelCtx.restore();
            }
            
            startAngle = endAngle;
        });
        
        // Dibujar círculo central
        wheelCtx.beginPath();
        wheelCtx.arc(centerX, centerY, Math.max(30, canvasSize / 16), 0, 2 * Math.PI);
        wheelCtx.fillStyle = '#2d3436';
        wheelCtx.fill();
        wheelCtx.strokeStyle = '#ffffff';
        wheelCtx.lineWidth = 3;
        wheelCtx.stroke();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Botón de login
        elements.ruletaLoginOpen.addEventListener('click', () => {
            elements.ruletaAuthModal.classList.remove('ruleta-hidden');
            switchToLoginForm();
        });
        
        // Botón de logout
        elements.ruletaLogout.addEventListener('click', logout);
        
        // Cerrar modal
        elements.ruletaCloseModal.addEventListener('click', () => {
            elements.ruletaAuthModal.classList.add('ruleta-hidden');
        });
        
        // Cambiar entre login y registro
        elements.ruletaSwitchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRegisterForm();
        });
        
        elements.ruletaSwitchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLoginForm();
        });
        
        // Botones de login y registro
        elements.ruletaLoginBtn.addEventListener('click', handleLogin);
        elements.ruletaRegisterBtn.addEventListener('click', handleRegister);
        
        // Botón de girar
        elements.spinBtn.addEventListener('click', handleSpin);
        
        // Cerrar resultado
        elements.closeResult.addEventListener('click', () => {
            elements.ruletaResultModal.classList.add('ruleta-hidden');
        });
        
        // Cerrar modales al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target === elements.ruletaAuthModal) {
                elements.ruletaAuthModal.classList.add('ruleta-hidden');
            }
            if (e.target === elements.ruletaResultModal) {
                elements.ruletaResultModal.classList.add('ruleta-hidden');
            }
        });
        
        // Permitir Enter en formularios
        elements.ruletaLoginEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        
        elements.ruletaLoginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        
        elements.ruletaRegisterPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleRegister();
        });
    }

    // Cambiar a formulario de login
    function switchToLoginForm() {
        elements.ruletaLoginForm.classList.add('ruleta-active');
        elements.ruletaRegisterForm.classList.remove('ruleta-active');
        elements.ruletaLoginEmail.focus();
    }

    // Cambiar a formulario de registro
    function switchToRegisterForm() {
        elements.ruletaRegisterForm.classList.add('ruleta-active');
        elements.ruletaLoginForm.classList.remove('ruleta-active');
        elements.ruletaRegisterName.focus();
    }

    // Manejar login
    function handleLogin() {
        const email = elements.ruletaLoginEmail.value.trim();
        const password = elements.ruletaLoginPassword.value;
        
        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('ruletaUsers'));
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            saveCurrentUser();
            updateSessionBar();
            elements.ruletaAuthModal.classList.add('ruleta-hidden');
            updateSpinButton();
            checkSpinAvailability();
            
            // Limpiar formulario
            elements.ruletaLoginEmail.value = '';
            elements.ruletaLoginPassword.value = '';
        } else {
            alert('Correo o contraseña incorrectos');
        }
    }

    // Manejar registro
function handleRegister() {
    const name = elements.ruletaRegisterName.value.trim();
    const email = elements.ruletaRegisterEmail.value.trim().toLowerCase();
    const password = elements.ruletaRegisterPassword.value;
    
    if (!name || !email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, ingresa un correo electrónico válido');
        return;
    }
    
    // Validar que el email sea de Gmail o Hotmail
    const emailDomain = email.split('@')[1];
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com'];
    
    if (!allowedDomains.includes(emailDomain)) {
        alert('Solo se permiten correos de Gmail o Hotmail/Outlook');
        elements.ruletaRegisterEmail.focus();
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('ruletaUsers'));
    
    // Verificar si el usuario ya existe
    if (users.some(user => user.email === email)) {
        alert('Este correo ya está registrado. Por favor, inicia sesión.');
        switchToLoginForm();
        return;
    }
    
    // Verificar si hay demasiados registros desde el mismo dominio (protección anti-abuso)
    const today = new Date().toISOString().split('T')[0];
    const registrosHoy = users.filter(user => {
        const userDate = user.registrationDate ? user.registrationDate.split('T')[0] : null;
        return userDate === today;
    }).length;
    
    // Límite de 10 registros por día (ajustable)
    if (registrosHoy >= 10) {
        alert('Se ha alcanzado el límite de registros por hoy. Por favor, intenta mañana.');
        return;
    }
    
    // Crear nuevo usuario
    const newUser = {
        name,
        email,
        password,
        registrationDate: new Date().toISOString(),
        lastSpin: null,
        spinsHistory: [],
        domain: emailDomain // Guardar el dominio para análisis
    };
    
    users.push(newUser);
    localStorage.setItem('ruletaUsers', JSON.stringify(users));
    
    // Iniciar sesión automáticamente
    currentUser = newUser;
    saveCurrentUser();
    updateSessionBar();
    elements.ruletaAuthModal.classList.add('ruleta-hidden');
    updateSpinButton();
    checkSpinAvailability();
    
    // Limpiar formulario
    elements.ruletaRegisterName.value = '';
    elements.ruletaRegisterEmail.value = '';
    elements.ruletaRegisterPassword.value = '';
    
    alert('¡Cuenta creada exitosamente!');
}

    // Cerrar sesión
    function logout() {
        currentUser = null;
        localStorage.removeItem('ruletaCurrentUser');
        updateSessionBar();
        updateSpinButton();
        checkSpinAvailability();
    }

    // Actualizar barra de sesión
    function updateSessionBar() {
        if (currentUser) {
            elements.ruletaUserName.textContent = `Hola, ${currentUser.name}`;
            elements.ruletaLoginOpen.classList.add('ruleta-hidden');
            elements.ruletaLogout.classList.remove('ruleta-hidden');
        } else {
            elements.ruletaUserName.textContent = '';
            elements.ruletaLoginOpen.classList.remove('ruleta-hidden');
            elements.ruletaLogout.classList.add('ruleta-hidden');
        }
    }

    // Actualizar botón de girar
    function updateSpinButton() {
        if (!currentUser) {
            elements.spinBtn.disabled = false;
            elements.spinBtn.innerHTML = '<i class="fas fa-redo-alt"></i> GIRAR';
            return;
        }
        
        const canSpin = canUserSpin();
        elements.spinBtn.disabled = !canSpin;
        
        if (!canSpin) {
            elements.spinBtn.innerHTML = '<i class="fas fa-clock"></i> ESPERA 3 DÍAS';
        } else {
            elements.spinBtn.innerHTML = '<i class="fas fa-redo-alt"></i> GIRAR';
        }
    }

    // Verificar si el usuario puede girar
    function canUserSpin() {
        if (!currentUser || !currentUser.lastSpin) return true;
        
        const lastSpinDate = new Date(currentUser.lastSpin);
        const now = new Date();
        const diffTime = Math.abs(now - lastSpinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= 3;
    }

    // Verificar disponibilidad de giro y actualizar contador
    function checkSpinAvailability() {
        if (!currentUser || !currentUser.lastSpin) {
            elements.nextSpinInfo.classList.add('ruleta-hidden');
            return;
        }
        
        const lastSpinDate = new Date(currentUser.lastSpin);
        const now = new Date();
        const nextSpinDate = new Date(lastSpinDate);
        nextSpinDate.setDate(nextSpinDate.getDate() + 3);
        
        if (now >= nextSpinDate) {
            elements.nextSpinInfo.classList.add('ruleta-hidden');
            return;
        }
        
        elements.nextSpinInfo.classList.remove('ruleta-hidden');
        updateRemainingTime(nextSpinDate);
        
        // Actualizar contador cada segundo
        if (window.spinTimer) clearInterval(window.spinTimer);
        window.spinTimer = setInterval(() => {
            updateRemainingTime(nextSpinDate);
        }, 1000);
    }

    // Actualizar tiempo restante
    function updateRemainingTime(nextSpinDate) {
        const now = new Date();
        const diff = nextSpinDate - now;
        
        if (diff <= 0) {
            elements.nextSpinInfo.classList.add('ruleta-hidden');
            if (window.spinTimer) clearInterval(window.spinTimer);
            updateSpinButton();
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        elements.remainingTime.textContent = 
            `Podrás girar nuevamente en ${hours}h ${minutes}m ${seconds}s`;
    }

    // Seleccionar premio basado en probabilidades
    function selectPrize() {
        const random = Math.random() * 100;
        let accumulatedProbability = 0;
        
        for (const premio of PREMIOS_RUELETA) {
            accumulatedProbability += premio.probabilidad;
            if (random < accumulatedProbability) {
                return premio;
            }
        }
        
        // Por seguridad, devolver el primer premio
        return PREMIOS_RUELETA[0];
    }

    // Calcular el ángulo para que un premio termine en la posición del puntero
    function calculateAngleForPrize(prizeIndex) {
        // La aguja está en la parte superior (ángulo = -π/2 o 270°)
        // Queremos que el centro del premio seleccionado termine allí
        
        // Calcular la suma total de probabilidades
        const totalProbability = PREMIOS_RUELETA.reduce((sum, premio) => sum + premio.probabilidad, 0);
        
        // Calcular el ángulo acumulado hasta el inicio del premio
        let startAngle = 0;
        for (let i = 0; i < prizeIndex; i++) {
            startAngle += (2 * Math.PI * PREMIOS_RUELETA[i].probabilidad) / totalProbability;
        }
        
        // Calcular el ángulo del premio seleccionado
        const prizeAngle = (2 * Math.PI * PREMIOS_RUELETA[prizeIndex].probabilidad) / totalProbability;
        
        // El centro del premio está a mitad de su ángulo
        const centerOfPrize = startAngle + (prizeAngle / 2);
        
        // Para que el centro del premio quede en la parte superior (ángulo -π/2),
        // necesitamos rotar la ruleta para que ese ángulo llegue a -π/2
        // La fórmula es: rotación = -π/2 - centerOfPrize
        return -Math.PI/2 - centerOfPrize;
    }

    // Girar la ruleta
    function spinWheel(prizeIndex) {
        return new Promise((resolve) => {
            if (wheelSpinning) return;
            
            wheelSpinning = true;
            elements.spinBtn.disabled = true;
            
            // Calcular el ángulo final para que el premio quede en la parte superior
            const targetAngle = calculateAngleForPrize(prizeIndex);
            
            // Agregar varias vueltas completas para efecto dramático
            const fullRotations = 5;
            const finalAngle = targetAngle - (fullRotations * 2 * Math.PI);
            
            // Parámetros de animación
            let startTime = null;
            const duration = 4000; // 4 segundos
            
            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Función de easing: comienza rápido y termina suave
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                // Calcular ángulo actual
                const currentAngle = finalAngle * easeOut;
                
                // Dibujar ruleta con la rotación actual
                drawWheel(currentAngle);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Asegurar posición final exacta
                    drawWheel(finalAngle);
                    
                    // Pequeña pausa antes de resolver
                    setTimeout(() => {
                        wheelSpinning = false;
                        resolve();
                    }, 500);
                }
            }
            
            requestAnimationFrame(animate);
        });
    }

    // Manejar el giro de la ruleta
    async function handleSpin() {
        // Verificar si el usuario está autenticado
        if (!currentUser) {
            elements.ruletaAuthModal.classList.remove('ruleta-hidden');
            switchToLoginForm();
            return;
        }
        
        // Verificar si puede girar
        if (!canUserSpin()) {
            alert('Debes esperar 3 días entre cada giro');
            return;
        }
        
        if (isSpinning || wheelSpinning) return;
        
        isSpinning = true;
        elements.spinBtn.disabled = true;
        
        // Seleccionar premio primero
        const premio = selectPrize();
        const prizeIndex = PREMIOS_RUELETA.findIndex(p => p.nombre === premio.nombre);
        
        console.log(`🎯 Premio seleccionado: ${premio.nombre} (índice: ${prizeIndex})`);
        
        // Girar la ruleta hacia el premio seleccionado
        await spinWheel(prizeIndex);
        
        // Actualizar usuario
        currentUser.lastSpin = new Date().toISOString();
        currentUser.spinsHistory.push({
            date: new Date().toISOString(),
            prize: premio.nombre,
            description: premio.descripcion
        });
        
        saveCurrentUser();
        
        // Mostrar resultado
        showResult(premio);
        
        // Actualizar UI
        updateSpinButton();
        checkSpinAvailability();
        
        isSpinning = false;
    }

    // Mostrar resultado del premio
    function showResult(premio) {
        elements.prizeWon.textContent = `${premio.icono} ${premio.nombre}`;
        elements.prizeDescription.textContent = premio.descripcion;
        elements.ruletaResultModal.classList.remove('ruleta-hidden');
    }

    // Inicializar la aplicación
    init();

    // Función de depuración para probar probabilidades
    window.testProbabilidades = function(veces = 1000) {
        console.log('🎰 TEST DE PROBABILIDADES 🎰');
        console.log(`Ejecutando ${veces} giros de prueba...`);
        
        const conteo = {};
        PREMIOS_RUELETA.forEach(premio => {
            conteo[premio.nombre] = 0;
        });
        
        for (let i = 0; i < veces; i++) {
            const premio = selectPrize();
            conteo[premio.nombre]++;
        }
        
        console.log('\nRESULTADOS:');
        console.log('───────────');
        PREMIOS_RUELETA.forEach(premio => {
            const cantidad = conteo[premio.nombre];
            const porcentaje = ((cantidad / veces) * 100).toFixed(2);
            const esperado = premio.probabilidad.toFixed(2);
            console.log(`${premio.nombre}:`);
            console.log(`  Esperado: ${esperado}%`);
            console.log(`  Obtenido: ${porcentaje}% (${cantidad} veces)`);
            console.log(`  Diferencia: ${Math.abs(porcentaje - esperado).toFixed(2)}%`);
        });
    };
    
    // Función para resetear usuarios (solo para desarrollo)
    window.resetRuleta = function() {
        if (confirm('¿Estás seguro de querer resetear toda la ruleta? Esto borrará todos los usuarios y giros.')) {
            localStorage.removeItem('ruletaUsers');
            localStorage.removeItem('ruletaCurrentUser');
            currentUser = null;
            init();
            alert('Ruleta reseteada. Recarga la página.');
        }
    };
});
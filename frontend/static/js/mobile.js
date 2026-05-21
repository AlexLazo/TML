// ==================== VARIABLES GLOBALES ====================
let rutaActual = null;
let etapasActiva = {};
let etapasEstado = [];
let solicitudesEnCurso = new Set();
let intervalosCronometro = {};
const API_BASE = '/api';
const RUTA_ACTIVA_KEY = 'tml_ruta_activa_id';
const RUTA_NOTAS_KEY = 'tml_ruta_activa_notas';

// ==================== ELEMENTOS DEL DOM ====================
const numeroRutaInput = document.getElementById('numeroRuta');
const btnNuevaRuta = document.getElementById('btnNuevaRuta');
const etapasContainer = document.getElementById('etapasContainer');
const cronometroDisplay = document.querySelector('.tiempo-actual');
const etapaActualDisplay = document.querySelector('.etapa-actual');
const etapasCompletadasSpan = document.getElementById('etapasCompletadas');
const tiempoTotalSpan = document.getElementById('tiempoTotal');
const notasRutaTextarea = document.getElementById('notasRuta');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalBtn = document.getElementById('modalBtn');
const closeBtn = document.querySelector('.close');

// ==================== EVENT LISTENERS ====================
numeroRutaInput.addEventListener('input', function() {
    this.value = normalizarCodigoRuta(this.value);
});

btnNuevaRuta.addEventListener('click', iniciarNuevaRuta);
btnGuardar.addEventListener('click', guardarRuta);
btnCancelar.addEventListener('click', cancelarRuta);
notasRutaTextarea.addEventListener('input', guardarNotasLocales);
closeBtn.addEventListener('click', cerrarModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
});

// ==================== FUNCIONES PRINCIPALES ====================

function normalizarCodigoRuta(valor) {
    const limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!limpio) return '';

    const primerCaracter = limpio.charAt(0);
    const patron = /[0-9]/.test(primerCaracter) ? /[^0-9]/g : /[^A-Z]/g;
    return limpio.replace(patron, '').slice(0, 2);
}

function codigoRutaValido(codigo) {
    return /^([0-9]{1,2}|[A-Z]{1,2})$/.test(codigo);
}

function persistirRutaActiva(rutaId) {
    localStorage.setItem(RUTA_ACTIVA_KEY, String(rutaId));
}

function limpiarRutaActivaPersistida() {
    localStorage.removeItem(RUTA_ACTIVA_KEY);
    localStorage.removeItem(RUTA_NOTAS_KEY);
}

function guardarNotasLocales() {
    if (rutaActual?.id) {
        localStorage.setItem(RUTA_NOTAS_KEY, notasRutaTextarea.value);
    }
}

async function restaurarRutaActiva() {
    const rutaId = localStorage.getItem(RUTA_ACTIVA_KEY);
    if (!rutaId) return;

    try {
        await cargarEtapas(rutaId);

        if (!rutaActual || rutaActual.estado !== 'activa') {
            limpiarRutaActivaPersistida();
            resetearFormulario();
            return;
        }

        numeroRutaInput.value = rutaActual.numero_ruta.replace(/^DS00/i, '');
        numeroRutaInput.disabled = true;
        btnNuevaRuta.disabled = true;
        notasRutaTextarea.value = localStorage.getItem(RUTA_NOTAS_KEY) || rutaActual.notas || '';
        mostrarAlerta('Ruta restaurada', `Se mantuvo activa la ruta ${rutaActual.numero_ruta}`);
    } catch (error) {
        console.error('Error al restaurar ruta activa:', error);
        limpiarRutaActivaPersistida();
    }
}

async function iniciarNuevaRuta() {
    const numeroDigitos = normalizarCodigoRuta(numeroRutaInput.value.trim());
    numeroRutaInput.value = numeroDigitos;
    
    if (!codigoRutaValido(numeroDigitos)) {
        mostrarAlerta('Error', 'Ingresa un maximo de 2 numeros o 2 letras. Ej: 50, DE, DH, 12, 13');
        return;
    }

    // Auto-completar con DS00
    const numeroRuta = 'DS00' + numeroDigitos;

    try {
        const response = await fetch(`${API_BASE}/rutas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: 1, // Por ahora usuario por defecto
                numero_ruta: numeroRuta,
                notas: ''
            })
        });

        if (!response.ok) {
            throw new Error(await leerErrorApi(response, 'No se pudo crear la ruta'));
        }

        const data = await response.json();
        rutaActual = data;
        persistirRutaActiva(data.id);
        localStorage.removeItem(RUTA_NOTAS_KEY);
        
        // Cargar etapas
        await cargarEtapas(data.id);
        
        numeroRutaInput.disabled = true;
        btnNuevaRuta.disabled = true;
        
        mostrarAlerta('Éxito', `Ruta ${numeroRuta} iniciada`);

        // Iniciar automáticamente la primera etapa
        const primeraEtapa = etapasEstado[0];
        if (primeraEtapa) {
            iniciarEtapa(primeraEtapa.id);
        }
    } catch (error) {
        console.error('Error al crear ruta:', error);
        mostrarAlerta('Error', 'No se pudo crear la ruta');
    }
}

async function cargarEtapas(rutaId) {
    try {
        const response = await fetch(`${API_BASE}/rutas/${rutaId}`);
        const data = await response.json();
        
        rutaActual = data;
        etapasEstado = data.etapas.sort((a, b) => a.orden - b.orden);
        etapasContainer.innerHTML = '';
        
        etapasEstado.forEach(etapa => {
            const etapaCard = crearTarjetaEtapa(etapa);
            etapasContainer.appendChild(etapaCard);
        });
        
        actualizarControlesEtapas();
        actualizarTiempoEnFila();
        await iniciarTiempoEnFilaAutomatico();
        restaurarCronometroActivo();
        actualizarResumen();
    } catch (error) {
        console.error('Error al cargar etapas:', error);
    }
}

function crearTarjetaEtapa(etapa) {
    const card = document.createElement('div');
    card.className = 'etapa-card';
    card.id = `etapa-${etapa.id}`;
    card.dataset.etapaId = etapa.id;
    card.dataset.orden = etapa.orden;
    card.dataset.iniciada = etapa.tiempo_inicio ? 'true' : 'false';
    card.dataset.finalizada = etapa.completada ? 'true' : 'false';

    if (etapa.tiempo_inicio && !etapa.tiempo_fin && !etapa.completada) {
        card.classList.add('activa');
    }
    if (etapa.completada) {
        card.classList.add('completada');
    }
    
    card.innerHTML = `
        <div class="etapa-nombre">${etapa.nombre}</div>
        <div class="etapa-tiempo" id="tiempo-${etapa.id}">
            ${etapa.duracion_formateada}
        </div>
        <div class="etapa-botones">
            <button class="etapa-btn btn-iniciar" onclick="iniciarEtapa(${etapa.id})">▶ Iniciar</button>
            <button class="etapa-btn btn-parar" onclick="pararEtapa(${etapa.id})">⏹ Parar</button>
            <button class="etapa-btn btn-reiniciar" onclick="reiniciarEtapa(${etapa.id})">↻ Reiniciar</button>
        </div>
    `;
    
    return card;
}

function obtenerEstadoEtapa(etapaId) {
    return etapasEstado.find(etapa => etapa.id === Number(etapaId));
}

function obtenerEtapaPorNombre(nombre) {
    return etapasEstado.find(etapa => etapa.nombre === nombre);
}

function formatearSegundos(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

function parseFechaApi(fecha) {
    if (!fecha) return null;
    const tieneZonaHoraria = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(fecha);
    const normalizada = tieneZonaHoraria ? fecha : `${fecha}Z`;
    const timestamp = new Date(normalizada).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

function obtenerEtapaActiva() {
    return etapasEstado.find(etapa => etapa.tiempo_inicio && !etapa.tiempo_fin && !etapa.completada);
}

function segundosDesdeInicio(tiempoInicio) {
    const inicio = parseFechaApi(tiempoInicio);
    if (inicio === null) return 0;
    return Math.max(0, Math.floor((Date.now() - inicio) / 1000));
}

function restaurarCronometroActivo() {
    Object.values(intervalosCronometro).forEach(intervalo => clearInterval(intervalo));
    intervalosCronometro = {};

    const etapaActiva = obtenerEtapaActiva();
    if (!etapaActiva) {
        cronometroDisplay.textContent = '00:00:00';
        etapaActualDisplay.textContent = rutaActual?.id ? 'Esperando siguiente etapa...' : 'Esperando ruta...';
        return;
    }

    etapaActualDisplay.textContent = `▶️ ${etapaActiva.nombre}`;
    iniciarCronometro(etapaActiva.id);
}

function marcarSolicitud(etapaId, accion, activa) {
    const llave = `${accion}-${etapaId}`;
    if (activa) {
        solicitudesEnCurso.add(llave);
    } else {
        solicitudesEnCurso.delete(llave);
    }
    actualizarControlesEtapas();
}

function solicitudEnCurso(etapaId, accion) {
    return solicitudesEnCurso.has(`${accion}-${etapaId}`);
}

function puedeIniciarEtapa(etapa) {
    if (!etapa || etapa.completada || etapa.tiempo_fin || etapa.tiempo_inicio) return false;
    if (obtenerEtapaActiva()) return false;
    return etapasEstado
        .filter(item => item.orden < etapa.orden)
        .every(item => item.completada);
}

function puedePararEtapa(etapa) {
    return Boolean(etapa && etapa.tiempo_inicio && !etapa.tiempo_fin && !etapa.completada);
}

function puedeReiniciarEtapa(etapa) {
    if (!etapa || etapa.completada || etapa.tiempo_fin) return false;
    return etapasEstado
        .filter(item => item.orden > etapa.orden)
        .every(item => !item.tiempo_inicio && !item.completada);
}

function actualizarEstadoEtapa(etapaId, cambios) {
    const etapa = obtenerEstadoEtapa(etapaId);
    if (etapa) {
        Object.assign(etapa, cambios);
    }

    const card = document.getElementById(`etapa-${etapaId}`);
    if (!card) return;

    const actualizada = obtenerEstadoEtapa(etapaId);
    card.dataset.iniciada = actualizada?.tiempo_inicio ? 'true' : 'false';
    card.dataset.finalizada = actualizada?.completada ? 'true' : 'false';
    card.classList.toggle('activa', puedePararEtapa(actualizada));
    card.classList.toggle('completada', Boolean(actualizada?.completada));
    actualizarControlesEtapas();
}

function actualizarControlesEtapas() {
    etapasEstado.forEach(etapa => {
        const card = document.getElementById(`etapa-${etapa.id}`);
        if (!card) return;

        const btnIniciar = card.querySelector('.btn-iniciar');
        const btnParar = card.querySelector('.btn-parar');
        const btnReiniciar = card.querySelector('.btn-reiniciar');
        const haySolicitud = ['iniciar', 'parar', 'reiniciar'].some(accion => solicitudEnCurso(etapa.id, accion));

        if (btnIniciar) btnIniciar.disabled = haySolicitud || !puedeIniciarEtapa(etapa);
        if (btnParar) btnParar.disabled = haySolicitud || !puedePararEtapa(etapa);
        if (btnReiniciar) btnReiniciar.disabled = haySolicitud || !puedeReiniciarEtapa(etapa);
    });
}

async function leerErrorApi(response, mensajeFallback) {
    try {
        const data = await response.json();
        return data.error || data.mensaje || mensajeFallback;
    } catch (error) {
        return mensajeFallback;
    }
}

async function refrescarRutaActual() {
    if (!rutaActual?.id) return;
    await cargarEtapas(rutaActual.id);
}

async function iniciarEtapa(etapaId) {
    const etapa = obtenerEstadoEtapa(etapaId);
    if (!puedeIniciarEtapa(etapa)) {
        mostrarAlerta('Validacion', 'Debes finalizar la etapa anterior y no tener otra etapa activa.');
        actualizarControlesEtapas();
        return;
    }

    marcarSolicitud(etapaId, 'iniciar', true);
    try {
        const response = await fetch(`${API_BASE}/etapas/${etapaId}/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(await leerErrorApi(response, 'No se pudo iniciar la etapa'));
        }

        const data = await response.json();

        const etapaCard = document.getElementById(`etapa-${etapaId}`);
        const nombreEtapa = etapaCard.querySelector('.etapa-nombre').textContent;
        
        // Mostrar etapa activa en el display principal
        etapaActualDisplay.textContent = `▶️ ${nombreEtapa}`;
        
        actualizarEstadoEtapa(etapaId, {
            tiempo_inicio: data.tiempo_inicio,
            tiempo_fin: null,
            completada: false,
            duracion_segundos: null,
            duracion_formateada: '00:00:00'
        });
        
        // Iniciar cronómetro
        iniciarCronometro(etapaId);
        
        actualizarResumen();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error', error.message);
        await refrescarRutaActual();
    } finally {
        marcarSolicitud(etapaId, 'iniciar', false);
    }
}

async function pararEtapa(etapaId) {
    const etapa = obtenerEstadoEtapa(etapaId);
    if (!puedePararEtapa(etapa)) {
        mostrarAlerta('Validacion', 'Solo puedes parar la etapa que esta iniciada.');
        actualizarControlesEtapas();
        return;
    }

    marcarSolicitud(etapaId, 'parar', true);
    try {
        const response = await fetch(`${API_BASE}/etapas/${etapaId}/parar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(await leerErrorApi(response, 'No se pudo parar la etapa'));
        }

        const data = await response.json();
        
        const etapaCard = document.getElementById(`etapa-${etapaId}`);
        etapaCard.classList.remove('activa');
        etapaCard.classList.add('completada');
        
        const tiempoElement = document.getElementById(`tiempo-${etapaId}`);
        tiempoElement.textContent = data.duracion_formateada;
        
        // Limpiar display principal
        etapaActualDisplay.textContent = 'Esperando siguiente etapa...';
        
        // Detener cronómetro
        clearInterval(intervalosCronometro[etapaId]);
        delete intervalosCronometro[etapaId];

        actualizarEstadoEtapa(etapaId, {
            tiempo_fin: data.tiempo_fin,
            duracion_segundos: data.duracion_segundos,
            duracion_formateada: data.duracion_formateada,
            completada: true
        });
        
        if (etapa.nombre === 'Botón de Pánico') {
            await iniciarTiempoEnFilaAutomatico();
        }

        actualizarResumen();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error', error.message);
        await refrescarRutaActual();
    } finally {
        marcarSolicitud(etapaId, 'parar', false);
    }
}

async function reiniciarEtapa(etapaId) {
    const etapa = obtenerEstadoEtapa(etapaId);
    if (!puedeReiniciarEtapa(etapa)) {
        mostrarAlerta('Validacion', 'No puedes reiniciar una etapa finalizada o una etapa anterior si ya avanzaste.');
        actualizarControlesEtapas();
        return;
    }

    marcarSolicitud(etapaId, 'reiniciar', true);
    try {
        const response = await fetch(`${API_BASE}/etapas/${etapaId}/reiniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(await leerErrorApi(response, 'No se pudo reiniciar la etapa'));
        }

        const etapaCard = document.getElementById(`etapa-${etapaId}`);
        etapaCard.classList.remove('activa', 'completada');
        
        const tiempoElement = document.getElementById(`tiempo-${etapaId}`);
        tiempoElement.textContent = '00:00:00';
        
        // Limpiar display si es la etapa activa
        etapaActualDisplay.textContent = 'Esperando siguiente etapa...';
        cronometroDisplay.textContent = '00:00:00';
        
        clearInterval(intervalosCronometro[etapaId]);
        delete intervalosCronometro[etapaId];

        actualizarEstadoEtapa(etapaId, {
            tiempo_inicio: null,
            tiempo_fin: null,
            duracion_segundos: null,
            duracion_formateada: '00:00:00',
            completada: false
        });
        
        actualizarResumen();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error', error.message);
        await refrescarRutaActual();
    } finally {
        marcarSolicitud(etapaId, 'reiniciar', false);
    }
}

function iniciarCronometro(etapaId) {
    if (intervalosCronometro[etapaId]) {
        clearInterval(intervalosCronometro[etapaId]);
    }

    const pintarTiempo = () => {
        const etapa = obtenerEstadoEtapa(etapaId);
        const segundos = segundosDesdeInicio(etapa?.tiempo_inicio);
    
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        const tiempoFormato = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
        
        // Actualizar tiempo de la etapa
        const tiempoEtapa = document.getElementById(`tiempo-${etapaId}`);
        if (tiempoEtapa) {
            tiempoEtapa.textContent = tiempoFormato;
        }
        
        // Actualizar cronómetro principal
        cronometroDisplay.textContent = tiempoFormato;
        
        // Actualizar resumen
        actualizarResumen();
    };

    pintarTiempo();
    intervalosCronometro[etapaId] = setInterval(pintarTiempo, 1000);
}

function actualizarTiempoEnFila() {
    const etapa = obtenerEtapaPorNombre('Tiempo en Fila');
    if (!etapa) {
        return;
    }

    const tiempoElement = document.getElementById(`tiempo-${etapa.id}`);
    if (!tiempoElement) {
        return;
    }

    const etapaPanico = obtenerEtapaPorNombre('Botón de Pánico');
    if (etapa.completada && etapa.duracion_formateada) {
        tiempoElement.textContent = etapa.duracion_formateada;
        return;
    }

    if (!etapaPanico || !etapaPanico.tiempo_fin) {
        tiempoElement.textContent = etapa.duracion_formateada || '00:00:00';
        return;
    }

    const inicio = parseFechaApi(etapaPanico.tiempo_fin);
    if (inicio === null) {
        tiempoElement.textContent = etapa.duracion_formateada || '00:00:00';
        return;
    }

    const diferencia = Math.max(0, Math.floor((Date.now() - inicio) / 1000));
    tiempoElement.textContent = formatearSegundos(diferencia);
    etapa.duracion_formateada = tiempoElement.textContent;
}

async function iniciarTiempoEnFilaAutomatico() {
    const etapa = obtenerEtapaPorNombre('Tiempo en Fila');
    if (!etapa || etapa.tiempo_inicio || etapa.tiempo_fin || etapa.completada) {
        return;
    }

    const etapaPanico = obtenerEtapaPorNombre('Botón de Pánico');
    if (!etapaPanico || !etapaPanico.tiempo_fin) {
        return;
    }

    try {
        await iniciarEtapa(etapa.id);
    } catch (error) {
        console.error('Error al iniciar Tiempo en Fila automaticamente:', error);
    }
}

function detenerOtrosEtapas(etapaActualId) {
    Object.keys(intervalosCronometro).forEach(id => {
        if (id !== etapaActualId.toString()) {
            clearInterval(intervalosCronometro[id]);
            delete intervalosCronometro[id];
        }
    });
}

function actualizarResumen() {
    let completadas = 0;
    let tiempoTotalSegundos = 0;
    
    document.querySelectorAll('.etapa-card').forEach(card => {
        if (card.classList.contains('completada')) {
            completadas++;
        }
        
        const tiempoText = card.querySelector('.etapa-tiempo').textContent;
        if (tiempoText !== '00:00:00' && tiempoText !== '-') {
            const partes = tiempoText.split(':');
            const segundos = parseInt(partes[0]) * 3600 + parseInt(partes[1]) * 60 + parseInt(partes[2]);
            tiempoTotalSegundos += segundos;
        }
    });
    
    const horas = Math.floor(tiempoTotalSegundos / 3600);
    const minutos = Math.floor((tiempoTotalSegundos % 3600) / 60);
    const segundos = tiempoTotalSegundos % 60;
    
    const tiempoTotal = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    
    etapasCompletadasSpan.textContent = `${completadas}/5`;
    tiempoTotalSpan.textContent = tiempoTotal;
}

async function guardarRuta() {
    if (!rutaActual) {
        mostrarAlerta('Error', 'No hay ruta activa');
        return;
    }

    if (obtenerEtapaActiva()) {
        mostrarAlerta('Validacion', 'Debes parar la etapa activa antes de guardar la ruta.');
        return;
    }

    if (etapasEstado.some(etapa => etapa.nombre !== 'Tiempo en Fila' && !etapa.completada)) {
        mostrarAlerta('Validacion', 'Debes completar todas las etapas antes de guardar la ruta.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rutas/${rutaActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'completada',
                notas: notasRutaTextarea.value
            })
        });

        if (!response.ok) {
            throw new Error(await leerErrorApi(response, 'No se pudo guardar la ruta'));
        }

        mostrarAlerta('Éxito', 'Ruta guardada correctamente');
        limpiarRutaActivaPersistida();
        setTimeout(resetearFormulario, 2000);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error', error.message);
    }
}

function cancelarRuta() {
    if (confirm('¿Estás seguro de que quieres cancelar esta ruta?')) {
        resetearFormulario();
    }
}

function resetearFormulario() {
    limpiarRutaActivaPersistida();
    rutaActual = null;
    etapasEstado = [];
    solicitudesEnCurso.clear();
    numeroRutaInput.value = '';
    numeroRutaInput.disabled = false;
    btnNuevaRuta.disabled = false;
    etapasContainer.innerHTML = '';
    notasRutaTextarea.value = '';
    etapasCompletadasSpan.textContent = '0/5';
    tiempoTotalSpan.textContent = '00:00:00';
    cronometroDisplay.textContent = '00:00:00';
    etapaActualDisplay.textContent = 'Esperando ruta...';
    
    Object.values(intervalosCronometro).forEach(intervalo => clearInterval(intervalo));
    intervalosCronometro = {};
}

// ==================== MODAL ====================
function mostrarAlerta(titulo, mensaje) {
    modalTitle.textContent = titulo;
    modalMessage.textContent = mensaje;
    modal.style.display = 'block';
}

function cerrarModal() {
    modal.style.display = 'none';
}

modalBtn.addEventListener('click', cerrarModal);
restaurarRutaActiva();

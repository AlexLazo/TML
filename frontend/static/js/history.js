// ==================== VARIABLES GLOBALES ====================
const API_BASE = '/api';

// ==================== ELEMENTOS DEL DOM ====================
const listadoRutas = document.getElementById('listadoRutas');
const filtroUsuario = document.getElementById('filtroUsuario');
const filtroEstado = document.getElementById('filtroEstado');
const btnAplicarFiltro = document.getElementById('btnAplicarFiltro');
const modalDetalles = document.getElementById('modalDetalles');
const modalTitulo = document.getElementById('modalTitulo');
const modalDetallesContenido = document.getElementById('modalDetallesContenido');
const closeBtn = document.querySelector('.close');

// ==================== EVENT LISTENERS ====================
btnAplicarFiltro.addEventListener('click', cargarRutas);
closeBtn.addEventListener('click', cerrarModal);
window.addEventListener('click', (e) => {
    if (e.target === modalDetalles) cerrarModal();
});

// Cargar rutas al iniciar
cargarRutas();

// ==================== FUNCIONES ====================

async function fetchAdmin(url) {
    const response = await fetch(url);
    if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        throw new Error('No autorizado');
    }
    if (!response.ok) {
        throw new Error('Error al cargar datos');
    }
    return response;
}

async function cargarRutas() {
    const usuarioId = filtroUsuario.value;
    const estado = filtroEstado.value;
    
    let url = `${API_BASE}/rutas`;
    const params = new URLSearchParams();
    
    if (usuarioId) params.append('usuario_id', usuarioId);
    if (estado) params.append('estado', estado);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }

    try {
        const response = await fetchAdmin(url);
        const rutas = await response.json();
        
        if (rutas.length === 0) {
            listadoRutas.innerHTML = '<p class="loading">No hay rutas registradas</p>';
            return;
        }

        listadoRutas.innerHTML = '';
        rutas.forEach(ruta => {
            const rutaElement = crearElementoRuta(ruta);
            listadoRutas.appendChild(rutaElement);
        });
    } catch (error) {
        console.error('Error al cargar rutas:', error);
        listadoRutas.innerHTML = '<p class="loading">Error al cargar rutas</p>';
    }
}

function crearElementoRuta(ruta) {
    const div = document.createElement('div');
    div.className = 'ruta-item';
    
    const fecha = new Date(ruta.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const estadoClass = `estado-${ruta.estado}`;
    
    div.innerHTML = `
        <div class="ruta-header">
            <h3>${ruta.numero_ruta}</h3>
            <span class="ruta-estado ${estadoClass}">${ruta.estado.toUpperCase()}</span>
        </div>
        <div class="ruta-info">
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Etapas:</strong> ${ruta.etapas_completadas}/${ruta.total_etapas}</p>
        </div>
        <button class="btn btn-secondary" onclick="verDetalles(${ruta.id})">Ver Detalles</button>
    `;
    
    return div;
}

async function verDetalles(rutaId) {
    try {
        const response = await fetchAdmin(`${API_BASE}/rutas/${rutaId}`);
        const ruta = await response.json();
        
        modalTitulo.textContent = `Ruta: ${ruta.numero_ruta}`;
        
        let html = `
            <div class="detalle-info">
                <p><strong>Fecha:</strong> ${new Date(ruta.fecha).toLocaleDateString('es-ES')}</p>
                <p><strong>Estado:</strong> <span class="estado-${ruta.estado}">${ruta.estado.toUpperCase()}</span></p>
                <p><strong>Notas:</strong> ${ruta.notas || 'Sin notas'}</p>
                <h4>Etapas:</h4>
                <table class="detalle-table">
                    <thead>
                        <tr>
                            <th>Etapa</th>
                            <th>Duración</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        ruta.etapas.forEach(etapa => {
            const estado = etapa.completada ? '✓ Completada' : 'Pendiente';
            html += `
                <tr>
                    <td>${etapa.nombre}</td>
                    <td>${etapa.duracion_formateada}</td>
                    <td>${estado}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        modalDetallesContenido.innerHTML = html;
        modalDetalles.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles');
    }
}

function cerrarModal() {
    modalDetalles.style.display = 'none';
}

// ==================== ESTILOS ADICIONALES ====================
const style = document.createElement('style');
style.textContent = `
    .ruta-item {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .ruta-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
    }

    .ruta-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .ruta-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 16px;
    }

    .ruta-estado {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    }

    .estado-completada {
        background: #d4edda;
        color: #155724;
    }

    .estado-activa {
        background: #fff3cd;
        color: #856404;
    }

    .estado-cancelada {
        background: #f8d7da;
        color: #721c24;
    }

    .ruta-info {
        font-size: 13px;
        color: #666;
        margin-bottom: 10px;
    }

    .ruta-info p {
        margin: 5px 0;
    }

    .detalle-info {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
    }

    .detalle-table {
        width: 100%;
        margin-top: 15px;
        border-collapse: collapse;
    }

    .detalle-table th,
    .detalle-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    .detalle-table th {
        background: #f0f0f0;
        font-weight: 600;
    }

    .filter-group {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
    }

    .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #2c3e50;
    }

    .filter-group select {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }

    .filter-group button {
        width: 100%;
    }

    .modal-large {
        max-width: 600px;
    }
`;

document.head.appendChild(style);

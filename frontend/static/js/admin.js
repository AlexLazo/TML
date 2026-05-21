// ==================== VARIABLES GLOBALES ====================
const API_BASE = '/api';
const ADMIN_BASE = '/admin';
let chartPromedios = null;
let chartRutasDiarias = null;
let chartComparativa = null;
let chartEstados = null;
let chartHoras = null;
let chartSupervisores = null;
let chartColaSupervisores = null;
let chartContratistas = null;
let chartTiempoCola = null;
const rolActual = document.body.dataset.role || 'operador';

// ==================== ELEMENTOS DEL DOM ====================
const navItems = document.querySelectorAll('.nav-item[data-section]');
const contentSections = document.querySelectorAll('.content-section');

// Dashboard
const statRutasTotales = document.getElementById('statRutasTotales');
const statRutasCompletadas = document.getElementById('statRutasCompletadas');
const statTasaCompletacion = document.getElementById('statTasaCompletacion');
const statUsuariosActivos = document.getElementById('statUsuariosActivos');
const statTiempoPromedio = document.getElementById('statTiempoPromedio');
const statTiempoColaPromedio = document.getElementById('statTiempoColaPromedio');
const statCuelloBotella = document.getElementById('statCuelloBotella');
const listaInsights = document.getElementById('listaInsights');
const listaRutasAtencion = document.getElementById('listaRutasAtencion');

// Rutas
const filtroRutasUsuario = document.getElementById('filtroRutasUsuario');
const filtroRutasEstado = document.getElementById('filtroRutasEstado');
const filtroRutasFecha = document.getElementById('filtroRutasFecha');
const filtroRutasSupervisor = document.getElementById('filtroRutasSupervisor');
const filtroRutasContratista = document.getElementById('filtroRutasContratista');
const btnDescargarExcel = document.getElementById('btnDescargarExcel');
const bodyTablaRutas = document.getElementById('bodyTablaRutas');
const filtroHistorialEstado = document.getElementById('filtroHistorialEstado');
const filtroHistorialSupervisor = document.getElementById('filtroHistorialSupervisor');
const filtroHistorialFecha = document.getElementById('filtroHistorialFecha');
const historialAdminLista = document.getElementById('historialAdminLista');
const btnImportarRutasFijas = document.getElementById('btnImportarRutasFijas');
const estadoImportacion = document.getElementById('estadoImportacion');
const bodyTablaRutasFijas = document.getElementById('bodyTablaRutasFijas');
const btnLimpiarDatos = document.getElementById('btnLimpiarDatos');
const usuarioId = document.getElementById('usuarioId');
const usuarioNombre = document.getElementById('usuarioNombre');
const usuarioEmail = document.getElementById('usuarioEmail');
const usuarioPassword = document.getElementById('usuarioPassword');
const usuarioRol = document.getElementById('usuarioRol');
const usuarioActivo = document.getElementById('usuarioActivo');
const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
const bodyTablaUsuarios = document.getElementById('bodyTablaUsuarios');
const dashboardFiltroPeriodo = document.getElementById('dashboardFiltroPeriodo');
const dashboardFiltroEstado = document.getElementById('dashboardFiltroEstado');
const dashboardFiltroSupervisor = document.getElementById('dashboardFiltroSupervisor');
const dashboardFiltroContratista = document.getElementById('dashboardFiltroContratista');
const btnDashboardRefrescar = document.getElementById('btnDashboardRefrescar');

// Reportes
const bodyTablaReportes = document.getElementById('bodyTablaReportes');

// Modal
const modalDetallesRuta = document.getElementById('modalDetallesRuta');
const detallesRutaContenido = document.getElementById('detallesRutaContenido');
const closeBtn = document.querySelector('.close');
const modalGraficoAmpliado = document.getElementById('modalGraficoAmpliado');
const tituloGraficoAmpliado = document.getElementById('tituloGraficoAmpliado');
const contenedorGraficoAmpliado = document.getElementById('contenedorGraficoAmpliado');
const btnCerrarGraficoAmpliado = document.getElementById('btnCerrarGraficoAmpliado');
let graficoAmpliado = null;

// ==================== EVENT LISTENERS ====================
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        mostrarSeccion(section);
    });
});

btnDescargarExcel.addEventListener('click', descargarExcel);
closeBtn.addEventListener('click', cerrarModalDetalles);
window.addEventListener('click', (e) => {
    if (e.target === modalDetallesRuta) cerrarModalDetalles();
    if (e.target === modalGraficoAmpliado) cerrarGraficoAmpliado();
});
btnCerrarGraficoAmpliado?.addEventListener('click', cerrarGraficoAmpliado);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalGraficoAmpliado?.style.display === 'block') {
        cerrarGraficoAmpliado();
    }
});

// Filtros
filtroRutasUsuario.addEventListener('change', cargarRutas);
filtroRutasEstado.addEventListener('change', cargarRutas);
filtroRutasFecha.addEventListener('change', cargarRutas);
filtroRutasSupervisor.addEventListener('change', cargarRutas);
filtroRutasContratista.addEventListener('change', cargarRutas);
dashboardFiltroPeriodo?.addEventListener('change', cargarDashboard);
dashboardFiltroEstado?.addEventListener('change', cargarDashboard);
dashboardFiltroSupervisor?.addEventListener('change', cargarDashboard);
dashboardFiltroContratista?.addEventListener('change', cargarDashboard);
btnDashboardRefrescar?.addEventListener('click', cargarDashboard);
filtroHistorialEstado.addEventListener('change', cargarHistorialAdmin);
filtroHistorialSupervisor.addEventListener('change', cargarHistorialAdmin);
filtroHistorialFecha.addEventListener('change', cargarHistorialAdmin);
btnImportarRutasFijas?.addEventListener('click', importarRutasFijas);
btnLimpiarDatos?.addEventListener('click', limpiarDatosRutas);
btnGuardarUsuario?.addEventListener('click', guardarUsuario);
btnCancelarUsuario?.addEventListener('click', limpiarFormularioUsuario);

// ==================== FUNCIONES DE NAVEGACIÓN ====================

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    contentSections.forEach(s => s.classList.remove('active'));
    
    // Desactivar todos los items de navegación
    navItems.forEach(item => item.classList.remove('active'));
    
    // Mostrar sección seleccionada
    document.getElementById(seccion).classList.add('active');
    
    // Activar item de navegación
    document.querySelector(`[data-section="${seccion}"]`).classList.add('active');
    
    // Cargar datos específicos
    if (seccion === 'dashboard') {
        cargarDashboard();
    } else if (seccion === 'rutas') {
        cargarOpcionesFiltros();
        cargarRutas();
    } else if (seccion === 'historial') {
        cargarOpcionesFiltros();
        cargarHistorialAdmin();
    } else if (seccion === 'reportes') {
        cargarReportes();
    } else if (seccion === 'maestro') {
        cargarRutasFijas();
    } else if (seccion === 'usuarios') {
        cargarUsuarios();
    }
}

// ==================== DASHBOARD ====================

async function fetchAdmin(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        throw new Error('No autorizado');
    }
    if (!response.ok) {
        let message = 'Error al cargar datos';
        try {
            const data = await response.json();
            message = data.error || data.mensaje || message;
        } catch (error) {
            message = await response.text() || message;
        }
        throw new Error(message);
    }
    return response;
}

async function cargarDashboard() {
    try {
        const params = new URLSearchParams();
        const periodo = dashboardFiltroPeriodo?.value || '30';
        const estado = dashboardFiltroEstado?.value;
        const supervisor = dashboardFiltroSupervisor?.value;
        const contratista = dashboardFiltroContratista?.value;

        params.append('dias', periodo);
        if (estado) params.append('estado', estado);
        if (supervisor) params.append('supervisor', supervisor);
        if (contratista) params.append('contratista', contratista);

        const [statsRes, historialRes, avanzadoRes] = await Promise.all([
            fetchAdmin(`${ADMIN_BASE}/estadisticas-general?${params}`),
            fetchAdmin(`${API_BASE}/historial-diario?dias=${periodo}`),
            fetchAdmin(`${ADMIN_BASE}/analisis-avanzado?${params}`)
        ]);

        const stats = await statsRes.json();
        const historial = await historialRes.json();
        const avanzado = await avanzadoRes.json();

        // Actualizar cards
        statRutasTotales.textContent = stats.rutas_totales;
        statRutasCompletadas.textContent = stats.rutas_completadas;
        statTasaCompletacion.textContent = stats.tasa_completacion;
        statUsuariosActivos.textContent = stats.usuarios_activos;
        statTiempoPromedio.textContent = stats.tiempo_promedio_total_fmt || '00:00:00';
        statTiempoColaPromedio.textContent = stats.tiempo_en_fila_promedio_fmt || '00:00:00';
        statCuelloBotella.textContent = stats.cuello_botella ? stats.cuello_botella.nombre : '-';

        // Gráfico de promedios
        dibujarGraficoPromedios(stats.etapas_promedio);
        
        // Gráfico de rutas diarias
        dibujarGraficoRutasDiarias(historial);

        dibujarGraficoEstados(stats.estados || {});
        dibujarGraficoHoras(avanzado.por_hora || {});
        dibujarGraficoRanking('chartSupervisores', chartSupervisores, avanzado.supervisores || [], 'Supervisor', chart => chartSupervisores = chart);
        dibujarGraficoTiempoCola(stats);
        dibujarGraficoRanking('chartContratistas', chartContratistas, avanzado.contratistas || [], 'Contratista', chart => chartContratistas = chart);
        dibujarGraficoColaSupervisores(avanzado.supervisores || []);
        renderizarInsights(stats, avanzado);
        await cargarOpcionesFiltros();
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}

async function cargarOpcionesFiltros() {
    const response = await fetchAdmin(`${ADMIN_BASE}/opciones-filtros`);
    const opciones = await response.json();

    llenarSelect(filtroRutasSupervisor, opciones.supervisores, 'Todos los supervisores');
    llenarSelect(filtroHistorialSupervisor, opciones.supervisores, 'Todos los supervisores');
    llenarSelect(filtroRutasContratista, opciones.contratistas, 'Todos los contratistas');
    llenarSelect(dashboardFiltroSupervisor, opciones.supervisores, 'Todos los supervisores');
    llenarSelect(dashboardFiltroContratista, opciones.contratistas, 'Todos los contratistas');
}

function llenarSelect(select, valores, placeholder) {
    const valorActual = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>`;
    valores.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
    select.value = valorActual;
}

function inicializarControlesGraficos() {
    document.querySelectorAll('.chart-box canvas').forEach(canvas => {
        const chartBox = canvas.closest('.chart-box');
        const titulo = chartBox?.querySelector('h3');
        if (!chartBox || !titulo || chartBox.querySelector('.chart-expand-btn')) return;

        const header = document.createElement('div');
        header.className = 'chart-box-header';
        titulo.parentNode.insertBefore(header, titulo);
        header.appendChild(titulo);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'chart-expand-btn';
        boton.textContent = 'Ampliar';
        boton.setAttribute('aria-label', `Ampliar ${titulo.textContent}`);
        boton.addEventListener('click', () => abrirGraficoAmpliado(canvas, titulo.textContent));
        header.appendChild(boton);
    });
}

function obtenerInstanciaChart(canvas) {
    if (window.Chart && typeof Chart.getChart === 'function') {
        return Chart.getChart(canvas);
    }
    return null;
}

function abrirGraficoAmpliado(canvas, titulo) {
    if (!modalGraficoAmpliado || !contenedorGraficoAmpliado || !canvas) return;
    if (graficoAmpliado) cerrarGraficoAmpliado();

    const marcador = document.createComment(`posicion-original-${canvas.id}`);
    canvas.parentNode.insertBefore(marcador, canvas);

    graficoAmpliado = {
        canvas,
        marcador,
        chart: obtenerInstanciaChart(canvas),
        maintainAspectRatio: obtenerInstanciaChart(canvas)?.options?.maintainAspectRatio
    };

    tituloGraficoAmpliado.textContent = titulo || 'Gráfico';
    contenedorGraficoAmpliado.appendChild(canvas);
    modalGraficoAmpliado.style.display = 'block';

    if (graficoAmpliado.chart) {
        graficoAmpliado.chart.options.maintainAspectRatio = false;
        graficoAmpliado.chart.resize();
    }
}

function cerrarGraficoAmpliado() {
    if (!graficoAmpliado) return;

    const { canvas, marcador, maintainAspectRatio } = graficoAmpliado;
    const chart = obtenerInstanciaChart(canvas);

    marcador.parentNode.insertBefore(canvas, marcador);
    marcador.remove();
    modalGraficoAmpliado.style.display = 'none';

    if (chart) {
        chart.options.maintainAspectRatio = maintainAspectRatio !== undefined ? maintainAspectRatio : true;
        chart.resize();
    }

    graficoAmpliado = null;
}

function dibujarGraficoPromedios(etapas) {
    const ctx = document.getElementById('chartPromedios');
    
    if (chartPromedios) chartPromedios.destroy();

    const labels = Object.keys(etapas);
    const datos = labels.map(etapa => Math.floor(etapas[etapa].promedio / 60)); // Convertir a minutos

    chartPromedios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio (minutos)',
                data: datos,
                backgroundColor: [
                    '#4472C4',
                    '#ED7D31',
                    '#A5A5A5',
                    '#FFC000',
                    '#5B9BD5'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function dibujarGraficoRutasDiarias(historial) {
    const ctx = document.getElementById('chartRutasDiarias');
    
    if (chartRutasDiarias) chartRutasDiarias.destroy();

    const fechas = Object.keys(historial).sort();
    const rutasTotales = fechas.map(f => historial[f].total);
    const rutasCompletadas = fechas.map(f => historial[f].completadas);

    chartRutasDiarias = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                {
                    label: 'Total',
                    data: rutasTotales,
                    borderColor: '#4472C4',
                    backgroundColor: 'rgba(68, 114, 196, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Completadas',
                    data: rutasCompletadas,
                    borderColor: '#70AD47',
                    backgroundColor: 'rgba(112, 173, 71, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function dibujarGraficoEstados(estados) {
    const ctx = document.getElementById('chartEstados');
    if (chartEstados) chartEstados.destroy();

    chartEstados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activas', 'Completadas', 'Canceladas'],
            datasets: [{
                data: [estados.activa || 0, estados.completada || 0, estados.cancelada || 0],
                backgroundColor: ['#3498DB', '#70AD47', '#E74C3C']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function dibujarGraficoHoras(porHora) {
    const ctx = document.getElementById('chartHoras');
    if (chartHoras) chartHoras.destroy();

    const horas = Object.keys(porHora).sort();
    const valores = horas.map(hora => porHora[hora]);

    chartHoras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: horas.map(hora => `${hora}:00`),
            datasets: [{
                label: 'Rutas iniciadas',
                data: valores,
                backgroundColor: '#5B9BD5'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function dibujarGraficoTiempoCola(stats) {
    const ctx = document.getElementById('chartTiempoCola');
    if (chartTiempoCola) chartTiempoCola.destroy();

    chartTiempoCola = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Con Tiempo en Fila', 'Sin Tiempo en Fila'],
            datasets: [{
                data: [stats.rutas_con_tiempo_en_fila || 0, stats.rutas_sin_tiempo_en_fila || 0],
                backgroundColor: ['#70AD47', '#E67E22']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${context.formattedValue}`
                    }
                }
            }
        }
    });
}

function dibujarGraficoColaSupervisores(supervisores) {
    const ctx = document.getElementById('chartColaSupervisores');
    if (chartColaSupervisores) chartColaSupervisores.destroy();

    const datos = supervisores.filter(item => item.cola_disponibles > 0).slice(0, 10);
    if (datos.length === 0) {
        chartColaSupervisores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sin datos'],
                datasets: [{
                    label: 'Promedio Cola (minutos)',
                    data: [0],
                    backgroundColor: '#8E44AD'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        return;
    }

    chartColaSupervisores = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(item => item.nombre),
            datasets: [{
                label: 'Promedio Tiempo en Fila (minutos)',
                data: datos.map(item => Math.round(item.promedio_cola / 60)),
                backgroundColor: '#8E44AD'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.formattedValue} min`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function dibujarGraficoRanking(canvasId, chartActual, datos, label, asignarChart) {
    const ctx = document.getElementById(canvasId);
    if (chartActual && typeof chartActual.destroy === 'function') {
        chartActual.destroy();
    }

    const top = datos.slice(0, 10);
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(item => item.nombre),
            datasets: [{
                label: 'Rutas',
                data: top.map(item => item.rutas),
                backgroundColor: '#4472C4'
            }, {
                label: 'Completadas',
                data: top.map(item => item.completadas),
                backgroundColor: '#70AD47'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: context => {
                            const item = top[context.dataIndex];
                            return `${label}: ${item.tasa}% completacion · promedio ${item.promedio_fmt}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    asignarChart(chart);
}

function renderizarInsights(stats, avanzado) {
    const insights = [];

    insights.push(`Tasa de completacion del periodo: ${stats.tasa_completacion}.`);
    if (stats.cuello_botella) {
        insights.push(`La etapa mas lenta en promedio es ${stats.cuello_botella.nombre} (${stats.cuello_botella.promedio_fmt}).`);
    }
    if (stats.tiempo_en_fila_promedio_fmt) {
        insights.push(`Tiempo en Fila promedio: ${stats.tiempo_en_fila_promedio_fmt}.`);
    }
    if (stats.ruta_mas_rapida) {
        insights.push(`Ruta mas rapida: ${stats.ruta_mas_rapida.numero_ruta} con ${stats.ruta_mas_rapida.tiempo_fmt}.`);
    }
    if (stats.ruta_mas_lenta) {
        insights.push(`Ruta mas lenta: ${stats.ruta_mas_lenta.numero_ruta} con ${stats.ruta_mas_lenta.tiempo_fmt}.`);
    }

    listaInsights.innerHTML = insights.map(texto => `<div class="insight-item">${texto}</div>`).join('');

    const rutas = avanzado.rutas_problematicas || [];
    if (!rutas.length) {
        listaRutasAtencion.innerHTML = '<div class="empty-state">Sin rutas pendientes en el periodo.</div>';
        return;
    }

    listaRutasAtencion.innerHTML = rutas.map(ruta => `
        <div class="attention-item">
            <strong>${ruta.numero_ruta}</strong>
            <span>${ruta.estado} · ${ruta.pendientes} etapas pendientes</span>
        </div>
    `).join('');
}

// ==================== RUTAS ====================

function obtenerDuracionEtapa(ruta, nombre) {
    return ruta.etapas.find(etapa => etapa.nombre === nombre)?.duracion_formateada || '-';
}

async function cargarRutas() {
    try {
        const usuario = filtroRutasUsuario.value;
        const estado = filtroRutasEstado.value;
        const fecha = filtroRutasFecha.value;
        const supervisor = filtroRutasSupervisor.value;
        const contratista = filtroRutasContratista.value;

        let url = `${ADMIN_BASE}/rutas-con-etapas`;
        const params = new URLSearchParams();
        
        if (usuario) params.append('usuario_id', usuario);
        if (estado) params.append('estado', estado);
        if (fecha) params.append('fecha', fecha);
        if (supervisor) params.append('supervisor', supervisor);
        if (contratista) params.append('contratista', contratista);
        
        if (params.toString()) url += '?' + params.toString();

        const response = await fetchAdmin(url);
        const rutas = await response.json();

        bodyTablaRutas.innerHTML = '';

        if (rutas.length === 0) {
            bodyTablaRutas.innerHTML = '<tr><td colspan="14" class="loading">No hay rutas</td></tr>';
            return;
        }

        rutas.forEach(ruta => {
            const row = document.createElement('tr');
            
            const etapasHtml = ruta.etapas.map(e => e.duracion_formateada).join(' | ');
            
            row.innerHTML = `
                <td>${ruta.id}</td>
                <td>${ruta.numero_ruta}</td>
                <td>${ruta.supervisor}</td>
                <td>${ruta.contratista}</td>
                <td>${ruta.usuario}</td>
                <td>${new Date(ruta.fecha).toLocaleDateString('es-ES')}</td>
                <td><span class="estado-${ruta.estado}">${ruta.estado}</span></td>
                <td>${obtenerDuracionEtapa(ruta, 'Matinal')}</td>
                <td>${obtenerDuracionEtapa(ruta, 'Conteo de Carga')}</td>
                <td>${obtenerDuracionEtapa(ruta, 'Check de Salida')}</td>
                <td>${obtenerDuracionEtapa(ruta, 'Botón de Pánico')}</td>
                <td>${obtenerDuracionEtapa(ruta, 'Tiempo en Fila')}</td>
                <td>${ruta.tiempo_total_formateado}</td>
                <td>
                    <button class="btn btn-primary" onclick="verDetallesRuta(${ruta.id})">Ver</button>
                    ${rolActual === 'admin' ? `<button class="btn btn-danger" onclick="eliminarRuta(${ruta.id})">Eliminar</button>` : ''}
                </td>
            `;
            
            bodyTablaRutas.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        bodyTablaRutas.innerHTML = '<tr><td colspan="14" class="loading">Error al cargar rutas</td></tr>';
    }
}

function verDetallesRuta(rutaId) {
    fetchAdmin(`${API_BASE}/rutas/${rutaId}`)
        .then(res => res.json())
        .then(ruta => {
            let html = `
                <div class="detalle-ruta">
                    <p><strong>Ruta:</strong> ${ruta.numero_ruta}</p>
                    <p><strong>Fecha:</strong> ${new Date(ruta.fecha).toLocaleDateString('es-ES')}</p>
                    <p><strong>Estado:</strong> ${ruta.estado}</p>
                    <p><strong>Notas:</strong> ${ruta.notas || 'Sin notas'}</p>
                    <h4>Detalles de Etapas:</h4>
                    <table class="data-table">
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
                html += `
                    <tr>
                        <td>${etapa.nombre}</td>
                        <td>${etapa.duracion_formateada}</td>
                        <td>${etapa.completada ? '✓' : '✗'}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            detallesRutaContenido.innerHTML = html;
            modalDetallesRuta.style.display = 'block';
        });
}

function cerrarModalDetalles() {
    modalDetallesRuta.style.display = 'none';
}

async function eliminarRuta(rutaId) {
    if (!confirm('¿Eliminar esta ruta y todas sus etapas?')) return;

    try {
        const response = await fetchAdmin(`${ADMIN_BASE}/rutas/${rutaId}`, { method: 'DELETE' });
        await response.json();
        await cargarRutas();
        await cargarDashboard();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo eliminar la ruta');
    }
}

async function cargarHistorialAdmin() {
    try {
        const params = new URLSearchParams();
        if (filtroHistorialEstado.value) params.append('estado', filtroHistorialEstado.value);
        if (filtroHistorialSupervisor.value) params.append('supervisor', filtroHistorialSupervisor.value);
        if (filtroHistorialFecha.value) params.append('fecha', filtroHistorialFecha.value);

        const url = `${ADMIN_BASE}/rutas-con-etapas${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetchAdmin(url);
        const rutas = await response.json();

        if (!rutas.length) {
            historialAdminLista.innerHTML = '<div class="empty-state">No hay rutas para los filtros seleccionados.</div>';
            return;
        }

        historialAdminLista.innerHTML = rutas.map(ruta => `
            <article class="history-card">
                <div class="history-card-header">
                    <div>
                        <h3>${ruta.numero_ruta}</h3>
                        <p>${new Date(ruta.fecha).toLocaleString('es-ES')}</p>
                    </div>
                    <span class="estado-${ruta.estado}">${ruta.estado}</span>
                </div>
                <div class="history-card-grid">
                    <span><strong>Supervisor</strong>${ruta.supervisor}</span>
                    <span><strong>Contratista</strong>${ruta.contratista}</span>
                    <span><strong>Canal</strong>${ruta.canal}</span>
                    <span><strong>Total</strong>${ruta.tiempo_total_formateado}</span>
                </div>
                <div class="history-stages">
                    ${ruta.etapas.map(etapa => `<span>${etapa.nombre}: ${etapa.duracion_formateada}</span>`).join('')}
                </div>
                <div class="history-actions">
                    <button class="btn btn-primary" onclick="verDetallesRuta(${ruta.id})">Ver</button>
                    ${rolActual === 'admin' ? `<button class="btn btn-danger" onclick="eliminarRuta(${ruta.id})">Eliminar</button>` : ''}
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        historialAdminLista.innerHTML = '<div class="empty-state">Error al cargar historial.</div>';
    }
}

async function cargarRutasFijas() {
    try {
        const response = await fetchAdmin(`${ADMIN_BASE}/rutas-fijas`);
        const rutas = await response.json();

        if (!rutas.length) {
            bodyTablaRutasFijas.innerHTML = '<tr><td colspan="5" class="loading">No hay rutas fijas importadas</td></tr>';
            return;
        }

        bodyTablaRutasFijas.innerHTML = rutas.map(ruta => `
            <tr>
                <td>${ruta.numero_ruta}</td>
                <td>${ruta.supervisor}</td>
                <td>${ruta.contratista}</td>
                <td>${ruta.canal}</td>
                <td>${ruta.estatus}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        bodyTablaRutasFijas.innerHTML = '<tr><td colspan="5" class="loading">Error al cargar rutas fijas</td></tr>';
    }
}

async function importarRutasFijas() {
    estadoImportacion.textContent = 'Importando...';
    try {
        const response = await fetchAdmin(`${ADMIN_BASE}/importar-rutas-fijas`, { method: 'POST' });
        const data = await response.json();
        estadoImportacion.textContent = `${data.total} rutas fijas cargadas (${data.importadas} nuevas, ${data.actualizadas} actualizadas)`;
        await cargarOpcionesFiltros();
        await cargarRutasFijas();
        await cargarDashboard();
    } catch (error) {
        console.error('Error:', error);
        estadoImportacion.textContent = 'No se pudo importar el archivo';
    }
}

async function limpiarDatosRutas() {
    const confirmacion = prompt('Escribe BORRAR para eliminar todas las rutas medidas.');
    if (confirmacion !== 'BORRAR') return;

    try {
        const response = await fetchAdmin(`${ADMIN_BASE}/limpiar-datos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmacion })
        });
        const data = await response.json();
        alert(`${data.rutas_eliminadas} rutas eliminadas`);
        await cargarDashboard();
        await cargarRutas();
        await cargarHistorialAdmin();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo limpiar la data');
    }
}

async function cargarUsuarios() {
    if (!bodyTablaUsuarios) return;

    try {
        const response = await fetchAdmin(`${ADMIN_BASE}/usuarios`);
        const usuarios = await response.json();

        if (!usuarios.length) {
            bodyTablaUsuarios.innerHTML = '<tr><td colspan="5" class="loading">No hay usuarios</td></tr>';
            return;
        }

        bodyTablaUsuarios.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.rol}</td>
                <td>${usuario.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                    <button class="btn btn-primary" onclick="editarUsuario(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(usuario))}')))">Editar</button>
                    <button class="btn btn-danger" onclick="eliminarUsuario(${usuario.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        bodyTablaUsuarios.innerHTML = `<tr><td colspan="5" class="loading">${error.message}</td></tr>`;
    }
}

async function guardarUsuario() {
    const id = usuarioId.value;
    const payload = {
        nombre: usuarioNombre.value.trim(),
        email: usuarioEmail.value.trim(),
        rol: usuarioRol.value,
        activo: usuarioActivo.checked
    };

    if (usuarioPassword.value) {
        payload.password = usuarioPassword.value;
    }

    if (!id && !payload.password) {
        alert('La contraseña es obligatoria para usuarios nuevos');
        return;
    }

    try {
        await fetchAdmin(`${ADMIN_BASE}/usuarios${id ? '/' + id : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        limpiarFormularioUsuario();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function editarUsuario(usuario) {
    usuarioId.value = usuario.id;
    usuarioNombre.value = usuario.nombre;
    usuarioEmail.value = usuario.email;
    usuarioRol.value = usuario.rol;
    usuarioActivo.checked = usuario.activo;
    usuarioPassword.value = '';
    usuarioPassword.placeholder = 'Nueva contraseña (opcional)';
}

function limpiarFormularioUsuario() {
    usuarioId.value = '';
    usuarioNombre.value = '';
    usuarioEmail.value = '';
    usuarioPassword.value = '';
    usuarioPassword.placeholder = 'Contraseña';
    usuarioRol.value = 'operador';
    usuarioActivo.checked = true;
}

async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;

    try {
        await fetchAdmin(`${ADMIN_BASE}/usuarios/${id}`, { method: 'DELETE' });
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function descargarExcel() {
    try {
        const usuario = filtroRutasUsuario.value;
        const estado = filtroRutasEstado.value;
        const fecha = filtroRutasFecha.value;
        const supervisor = filtroRutasSupervisor.value;
        const contratista = filtroRutasContratista.value;

        let url = `${ADMIN_BASE}/descargar-excel`;
        const params = new URLSearchParams();
        
        if (usuario) params.append('usuario_id', usuario);
        if (estado) params.append('estado', estado);
        if (fecha) params.append('fecha', fecha);
        if (supervisor) params.append('supervisor', supervisor);
        if (contratista) params.append('contratista', contratista);
        
        if (params.toString()) url += '?' + params.toString();

        window.location.href = url;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al descargar Excel');
    }
}

// ==================== REPORTES ====================

function formatearSegundos(segundos) {
    const valor = Number(segundos) || 0;
    const minutos = Math.floor(valor / 60);
    const segs = valor % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

async function cargarReportes() {
    try {
        const response = await fetchAdmin(`${API_BASE}/etapas-promedio`);
        const etapas = await response.json();

        bodyTablaReportes.innerHTML = '';

        Object.keys(etapas).forEach(nombre => {
            const data = etapas[nombre];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${nombre}</td>
                <td>${formatearSegundos(data.promedio)}</td>
                <td>${formatearSegundos(data.minimo)}</td>
                <td>${formatearSegundos(data.maximo)}</td>
                <td>${data.cantidad}</td>
            `;
            
            bodyTablaReportes.appendChild(row);
        });

        // Gráfico comparativa
        dibujarGraficoComparativa(etapas);
    } catch (error) {
        console.error('Error:', error);
    }
}

function dibujarGraficoComparativa(etapas) {
    const ctx = document.getElementById('chartComparativa');
    
    if (chartComparativa) chartComparativa.destroy();

    const labels = Object.keys(etapas);
    const promedios = labels.map(e => Math.floor(etapas[e].promedio / 60));
    const minimos = labels.map(e => Math.floor(etapas[e].minimo / 60));
    const maximos = labels.map(e => Math.floor(etapas[e].maximo / 60));

    chartComparativa = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Promedio',
                    data: promedios,
                    borderColor: '#4472C4',
                    backgroundColor: 'rgba(68, 114, 196, 0.1)'
                },
                {
                    label: 'Mínimo',
                    data: minimos,
                    borderColor: '#70AD47',
                    backgroundColor: 'rgba(112, 173, 71, 0.1)'
                },
                {
                    label: 'Máximo',
                    data: maximos,
                    borderColor: '#E74C3C',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Cargar seccion inicial
inicializarControlesGraficos();
const seccionInicial = window.location.hash ? window.location.hash.replace('#', '') : 'dashboard';
if (document.getElementById(seccionInicial)) {
    mostrarSeccion(seccionInicial);
} else {
    cargarDashboard();
}

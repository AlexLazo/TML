📁 TML - Sistema de Medición de Tiempos de Rutas
│
├── 📄 README.md                    ← Lee primero (documentación completa)
├── 📄 INICIO_RAPIDO.md             ← Guía de inicio rápido
├── 📄 ESTRUCTURA.md                ← Este archivo
│
├── ⚙️ INSTALAR.bat                 ← Ejecutar PRIMERO (instala dependencias)
├── ⚙️ EJECUTAR.bat                 ← Ejecutar para iniciar la app
├── 🐍 run.py                       ← Script principal (python run.py)
├── 🐍 run.sh                       ← Script para Linux/Mac
│
├── 📊 requirements.txt              ← Dependencias Python
├── 📄 .env.example                 ← Variables de entorno
├── 📄 .gitignore                   ← Configuración Git
│
├── 🐍 populate_demo.py             ← Generar datos de ejemplo
├── 🐍 mantenimiento.py             ← Herramientas de mantenimiento
│
│
├── 📁 backend/                     ← Aplicación Flask (servidor)
│   ├── 🐍 __init__.py              ← Package init
│   ├── 🐍 app.py                   ← Aplicación principal (punto de entrada)
│   ├── 🐍 models.py                ← Modelos de BD (Usuario, Ruta, Etapa)
│   │
│   ├── 📁 routes/                  ← Endpoints de la API
│   │   ├── 🐍 api.py               ← Endpoints principales
│   │   └── 🐍 admin.py             ← Endpoints administrativos
│   │
│   └── 💾 database.db              ← Base de datos SQLite (creada automáticamente)
│
│
├── 📁 frontend/                    ← Interfaz web (cliente)
│   │
│   ├── 📁 templates/               ← Archivos HTML
│   │   ├── 📁 mobile/              ← Interfaz móvil
│   │   │   ├── 📄 index.html       ← Cronómetro (URL: http://localhost:5000/)
│   │   │   └── 📄 history.html     ← Historial (URL: http://localhost:5000/historial)
│   │   │
│   │   └── 📁 admin/               ← Panel administrativo
│   │       ├── 📄 dashboard.html   ← Dashboard (URL: http://localhost:5000/dashboard)
│   │       └── 📄 reports.html     ← Reportes
│   │
│   └── 📁 static/                  ← Archivos estáticos
│       ├── 📁 css/
│       │   ├── 📄 mobile.css       ← Estilos interfaz móvil (responsive)
│       │   └── 📄 admin.css        ← Estilos panel admin
│       │
│       └── 📁 js/
│           ├── 📄 mobile.js        ← Lógica cronómetro
│           ├── 📄 history.js       ← Lógica historial
│           └── 📄 admin.js         ← Lógica gráficas (Chart.js)
│
└── 📁 venv/                        ← Ambiente virtual (creado automáticamente)


════════════════════════════════════════════════════════════════════════

🚀 FLUJO DE EJECUCIÓN

1️⃣  Primera vez:
    Double-click: INSTALAR.bat
    ↓ (instala Python packages)

2️⃣  Ejecutar la app:
    Double-click: EJECUTAR.bat
    ↓ (inicia Flask en http://localhost:5000)

3️⃣  Acceder a:
    📱 Interfaz Móvil:   http://localhost:5000/
    📋 Historial:        http://localhost:5000/historial
    📊 Admin Dashboard:  http://localhost:5000/dashboard


════════════════════════════════════════════════════════════════════════

📊 MODELOS DE DATOS

┌─ Usuario ─────────────────────┐
│ • id (int)                    │
│ • nombre (string)             │
│ • email (string)              │
│ • password (string)           │
│ • es_admin (boolean)          │
│ • activo (boolean)            │
│ • fecha_creacion (datetime)   │
│ → Relación: Muchas Rutas      │
└───────────────────────────────┘

┌─ Ruta ────────────────────────┐
│ • id (int)                    │
│ • numero_ruta (string)        │
│ • usuario_id (FK)             │
│ • fecha (datetime)            │
│ • estado (string)             │
│ • notas (text)                │
│ → Relación: Muchas Etapas     │
└───────────────────────────────┘

┌─ Etapa ────────────────────────┐
│ • id (int)                     │
│ • ruta_id (FK)                 │
│ • nombre (string)              │
│ • orden (int)                  │
│ • tiempo_inicio (datetime)     │
│ • tiempo_fin (datetime)        │
│ • duracion_segundos (int)      │
│ • completada (boolean)         │
└────────────────────────────────┘

┌─ ConfiguracionEtapa ───────────┐
│ • id (int)                     │
│ • nombre (string)              │
│ • orden (int)                  │
│ • activa (boolean)             │
│ • descripcion (text)           │
└────────────────────────────────┘


════════════════════════════════════════════════════════════════════════

🔌 ENDPOINTS API DISPONIBLES

📍 Rutas
  GET    /api/rutas                    - Listar todas
  POST   /api/rutas                    - Crear nueva
  GET    /api/rutas/{id}               - Obtener específica
  PUT    /api/rutas/{id}               - Actualizar
  DELETE /api/rutas/{id}               - Eliminar

⏱️ Etapas
  POST   /api/etapas/{id}/iniciar      - Iniciar cronómetro
  POST   /api/etapas/{id}/parar        - Parar cronómetro
  POST   /api/etapas/{id}/reiniciar    - Reiniciar etapa

📈 Análisis
  GET    /api/estadisticas             - Stats generales
  GET    /api/etapas-promedio          - Promedios por etapa
  GET    /api/historial-diario         - Historial diario

👨‍💼 Admin
  GET    /admin/rutas-con-etapas       - Todas rutas + etapas
  GET    /admin/descargar-excel        - Descargar Excel
  GET    /admin/estadisticas-general   - Stats completas


════════════════════════════════════════════════════════════════════════

🎨 INTERFAZ Y FUNCIONALIDADES

📱 MÓVIL (index.html)
  ✓ Input número de ruta
  ✓ 5 etapas cronometrables
  ✓ Botones: Iniciar, Parar, Reiniciar
  ✓ Resumen en tiempo real
  ✓ Notas opcionales
  ✓ Guardar/Cancelar ruta
  ✓ Links a historial y admin

📋 HISTORIAL (history.html)
  ✓ Listado de rutas
  ✓ Filtros: usuario, estado
  ✓ Ver detalles (modal)
  ✓ Información de etapas

📊 ADMIN DASHBOARD (dashboard.html)
  ✓ Cards con estadísticas
  ✓ Gráfico barras: promedios
  ✓ Gráfico línea: rutas/día
  ✓ Tabla de rutas con filtros
  ✓ Exportar a Excel
  ✓ Gráfico radar: comparativa
  ✓ Reportes por etapa


════════════════════════════════════════════════════════════════════════

⚙️ STACK TECNOLÓGICO

Backend
  • Flask 2.3.3 (micro-framework)
  • SQLAlchemy (ORM)
  • SQLite (base de datos)
  • openpyxl (Excel export)
  • Python 3.8+

Frontend
  • HTML5, CSS3, JavaScript Vanilla
  • Chart.js (gráficas interactivas)
  • Responsive design (mobile-first)

Deploy
  • Local: Flask development server
  • Production ready: gunicorn ready


════════════════════════════════════════════════════════════════════════

📝 ETAPAS MEDIDAS

1. 🌅 MATINAL              - Preparación matinal
2. 🖨️ IMPRESIÓN            - Impresión de previsita
3. 📦 CONTEO DE CARGA      - Conteo de paquetes
4. ✅ CHECK DE SALIDA      - Verificación de salida
5. 🚨 BOTÓN DE PÁNICO      - Seguridad


════════════════════════════════════════════════════════════════════════

💡 EJEMPLOS DE USO

CREAR RUTA:
  POST /api/rutas
  {
    "usuario_id": 1,
    "numero_ruta": "RUTA-001",
    "notas": "Ruta normal"
  }

INICIAR ETAPA:
  POST /api/etapas/5/iniciar

PARAR ETAPA:
  POST /api/etapas/5/parar

DESCARGAR EXCEL:
  GET /admin/descargar-excel?usuario_id=1&estado=completada


════════════════════════════════════════════════════════════════════════

🔧 MANTENIMIENTO

Generar datos demo:
  python populate_demo.py

Menú de mantenimiento:
  python mantenimiento.py
  - Limpiar BD
  - Generar datos demo
  - Resetear todo


════════════════════════════════════════════════════════════════════════

📞 SOPORTE RÁPIDO

¿Cómo cambiar puerto?
  Edita run.py: app.run(port=5001)

¿Cómo habilitar/deshabilitar debug?
  Edita run.py: debug=False

¿Acceder desde otra máquina?
  host='0.0.0.0' (ya habilitado en run.py)
  http://<tu-ip>:5000

¿Limpiar todo?
  python mantenimiento.py → opción 3


════════════════════════════════════════════════════════════════════════

📅 Versión: 1.0.0
🔧 Última actualización: Mayo 2026

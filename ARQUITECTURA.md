```
╔════════════════════════════════════════════════════════════════════════════╗
║                   🚀 TML - ARQUITECTURA DEL SISTEMA                        ║
╚════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│                           📱 CAPA PRESENTACIÓN                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│    ┌─────────────────────────┐    ┌──────────────────────────┐          │
│    │   Interfaz Móvil       │    │   Panel Administrador     │          │
│    │   (index.html)         │    │   (dashboard.html)       │          │
│    │                         │    │                          │          │
│    │ • Cronómetro          │    │ • Dashboard Stats       │          │
│    │ • Etapas             │    │ • Tabla de Rutas        │          │
│    │ • Inicio/Parada      │    │ • Gráficas (Chart.js)   │          │
│    │ • Resumen            │    │ • Filtros Avanzados     │          │
│    │                         │    │ • Exportar Excel        │          │
│    └─────────────────────────┘    └──────────────────────────┘          │
│            │                                │                            │
│            │         HTML5 / CSS3 / JS      │                            │
│            └─────────────────┬──────────────┘                            │
│                              │                                           │
└──────────────────────────────│──────────────────────────────────────────┘
                               │
                    RESTful API / JSON
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         🔌 CAPA API (Flask)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  routes/api.py   │  │ routes/admin.py  │  │   app.py         │      │
│  │                  │  │                  │  │                  │      │
│  │ • GET /rutas     │  │ • GET rutas-con  │  │ • Flask Setup   │      │
│  │ • POST /rutas    │  │   -etapas        │  │ • Configuración │      │
│  │ • PUT /rutas     │  │ • GET descarga   │  │ • Middleware    │      │
│  │ • DELETE /rutas  │  │   -excel         │  │ • Error Handler │      │
│  │ • POST etapas/   │  │ • GET estadís    │  │                  │      │
│  │   iniciar        │  │   -ticas         │  │                  │      │
│  │ • POST etapas/   │  │                  │  │                  │      │
│  │   parar          │  │                  │  │                  │      │
│  │ • GET análisis   │  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
└──────────────────────────────▲──────────────────────────────────────────┘
                               │
                    Queries/Commands
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                    🗄️ CAPA DE DATOS (SQLAlchemy)                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    models.py - ORM                               │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Usuario    │  │    Ruta      │  │      Etapa           │  │   │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │   │
│  │  │ id           │  │ id           │  │ id                   │  │   │
│  │  │ nombre       │  │ numero_ruta  │  │ nombre               │  │   │
│  │  │ email        │  │ usuario_id───┼──→ ruta_id              │  │   │
│  │  │ password     │  │ fecha        │  │ orden                │  │   │
│  │  │ es_admin     │  │ estado       │  │ tiempo_inicio        │  │   │
│  │  │ activo       │  │ notas        │  │ tiempo_fin           │  │   │
│  │  │              │  │              │  │ duracion_segundos    │  │   │
│  │  │ ◄────────────┼──┘              │  │ completada           │  │   │
│  │  │ Relación:    │                 │  │                      │  │   │
│  │  │ 1 a Muchos   │                 │  │ ◄─────────────────────┘  │   │
│  │  └──────────────┘                 └──────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────┐                                   │   │
│  │  │ ConfiguracionEtapa       │                                   │   │
│  │  ├──────────────────────────┤                                   │   │
│  │  │ id                       │                                   │   │
│  │  │ nombre (Matinal, etc)    │                                   │   │
│  │  │ orden                    │                                   │   │
│  │  │ activa                   │                                   │   │
│  │  │ descripcion              │                                   │   │
│  │  └──────────────────────────┘                                   │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└──────────────────────────────▲──────────────────────────────────────────┘
                               │
                        SQL Operations
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                    💾 BASE DE DATOS (SQLite)                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                      database.db (Archivo)                               │
│                                                                           │
│    ┌─────────────┬─────────────┬─────────────┬──────────────────┐       │
│    │  USUARIOS   │   RUTAS     │   ETAPAS    │ CONFIGUR_ETAPAS  │       │
│    ├─────────────┼─────────────┼─────────────┼──────────────────┤       │
│    │ id (PK)     │ id (PK)     │ id (PK)     │ id (PK)          │       │
│    │ nombre      │ numero_ruta │ nombre      │ nombre           │       │
│    │ email (U)   │ usuario_id  │ ruta_id(FK) │ orden            │       │
│    │ password    │ fecha       │ orden       │ activa           │       │
│    │ es_admin    │ estado      │ inicio      │ descripcion      │       │
│    │ activo      │ notas       │ fin         │                  │       │
│    │             │             │ duracion    │                  │       │
│    │             │             │ completada  │                  │       │
│    └─────────────┴─────────────┴─────────────┴──────────────────┘       │
│                                                                           │
│    Índices: PK (Primary Key), FK (Foreign Key), U (Unique)               │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘


╔════════════════════════════════════════════════════════════════════════════╗
║                         📊 FLUJO DE DATOS                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

1️⃣  CREAR RUTA
    Usuario (móvil) → Ingresa número de ruta
           ↓
    mobile.js → POST /api/rutas (JSON)
           ↓
    app.py → api.py (crear_ruta)
           ↓
    SQLAlchemy → BD (INSERT Usuario, Ruta, Etapas)
           ↓
    Response JSON → mobile.js carga etapas


2️⃣  CRONOMETRAR ETAPA
    Usuario → Presiona ▶ Iniciar
           ↓
    mobile.js → POST /api/etapas/{id}/iniciar
           ↓
    app.py → api.py (iniciar_etapa)
           ↓
    SQLAlchemy → BD (UPDATE Etapa: tiempo_inicio)
           ↓
    Response → mobile.js inicia contador local


3️⃣  PARAR ETAPA
    Usuario → Presiona ⏹ Parar
           ↓
    mobile.js → POST /api/etapas/{id}/parar
           ↓
    app.py → api.py (parar_etapa - calcula duracion)
           ↓
    SQLAlchemy → BD (UPDATE Etapa: tiempo_fin, duracion)
           ↓
    Response → mobile.js actualiza UI


4️⃣  GUARDAR RUTA
    Usuario → Presiona ✓ Guardar
           ↓
    mobile.js → PUT /api/rutas/{id} (estado: completada)
           ↓
    app.py → api.py (actualizar_ruta)
           ↓
    SQLAlchemy → BD (UPDATE Ruta: estado)
           ↓
    Response → Ruta guardada en BD


5️⃣  VER DASHBOARD
    Administrador → Accede /dashboard
           ↓
    admin.js → GET /admin/estadisticas-general
           ↓
    app.py → admin.py (query compleja)
           ↓
    SQLAlchemy → BD (SELECT con aggregations)
           ↓
    Response JSON → Chart.js dibuja gráficas


6️⃣  DESCARGAR EXCEL
    Admin → Presiona Descargar Excel
           ↓
    admin.js → GET /admin/descargar-excel
           ↓
    app.py → admin.py (genera XLSX con openpyxl)
           ↓
    Response → Archivo descargado al navegador


╔════════════════════════════════════════════════════════════════════════════╗
║                       🔐 SEGURIDAD (Futuro)                               ║
╚════════════════════════════════════════════════════════════════════════════╝

        Usuario (navegador)
              │
              ↓
        ┌──────────────────┐
        │ Login / JWT      │ ← Token en Header Authorization
        └──────────────────┘
              │
              ↓
        ┌──────────────────┐
        │ Flask Middleware │ ← Valida JWT
        └──────────────────┘
              │
              ↓
        ┌──────────────────┐
        │ Autorización     │ ← Verifica es_admin
        └──────────────────┘
              │
              ↓
        ┌──────────────────┐
        │ Ejecuta Endpoint │ ← Seguro ✓
        └──────────────────┘


╔════════════════════════════════════════════════════════════════════════════╗
║                    🚀 DEPLOYMENT (Futuro)                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

Desarrollo:         Production:
┌─────────────┐    ┌──────────────────┐
│ Flask Dev   │    │ Docker Container │
│ localhost   │    │ ├─ Flask + Gun   │
│ SQLite      │    │ ├─ Nginx (proxy) │
└─────────────┘    │ └─ PostgreSQL    │
                   └──────────────────┘
                           │
                    ┌──────▼───────┐
                    │  Cloud (Azure)│
                    ├─ App Service │
                    ├─ Storage     │
                    └───────────────┘


╔════════════════════════════════════════════════════════════════════════════╗
║                      ✅ LISTA DE ARCHIVOS CREADOS                         ║
╚════════════════════════════════════════════════════════════════════════════╝

DOCUMENTACIÓN (7 archivos):
✓ README.md                 - Documentación completa
✓ INICIO_RAPIDO.md         - Guía rápida
✓ GUIA_WINDOWS.md          - Paso a paso Windows
✓ ESTRUCTURA.md            - Estructura completa
✓ MEJORAS_FUTURAS.md       - Ideas de mejora
✓ ARQUITECTURA.md          - Este archivo
✓ .env.example             - Variables de entorno

CONFIGURACIÓN (4 archivos):
✓ requirements.txt         - Dependencias Python
✓ .gitignore              - Control de versiones
✓ run.py                  - Script principal
✓ run.sh                  - Script Linux/Mac

INSTALACIÓN (2 archivos):
✓ INSTALAR.bat            - Instalador Windows
✓ EJECUTAR.bat            - Ejecutable Windows

BACKEND (5 archivos):
✓ backend/__init__.py     - Package init
✓ backend/app.py          - Aplicación Flask
✓ backend/models.py       - Modelos ORM
✓ backend/routes/api.py   - API endpoints
✓ backend/routes/admin.py - Admin endpoints

FRONTEND - HTML (4 archivos):
✓ frontend/templates/mobile/index.html        - Interfaz principal
✓ frontend/templates/mobile/history.html      - Historial
✓ frontend/templates/admin/dashboard.html     - Admin dashboard
✓ frontend/templates/admin/reports.html       - Reportes

FRONTEND - CSS (2 archivos):
✓ frontend/static/css/mobile.css              - Estilos móvil
✓ frontend/static/css/admin.css               - Estilos admin

FRONTEND - JavaScript (3 archivos):
✓ frontend/static/js/mobile.js                - Lógica móvil
✓ frontend/static/js/history.js               - Lógica historial
✓ frontend/static/js/admin.js                 - Lógica admin

UTILIDADES (2 archivos):
✓ populate_demo.py        - Generador de datos
✓ mantenimiento.py        - Herramientas de mantenimiento

TOTAL: 30 ARCHIVOS CREADOS ✅

```

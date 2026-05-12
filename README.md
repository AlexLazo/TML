# 📊 TML - Sistema de Medición de Tiempos de Rutas

Una aplicación web moderna para medir y analizar los tiempos de salida de rutas, con interfaz móvil para toma de datos e panel administrativo para análisis.

## 🎯 Características

- ✅ **Cronómetro Multi-Etapa**: Mide 5 etapas diferentes (Matinal, Impresión, Conteo, Check de Salida, Pánico)
- ✅ **Interfaz Móvil Responsive**: Optimizada para smartphones
- ✅ **Panel de Administrador**: Dashboard con gráficas y estadísticas
- ✅ **Base de Datos**: SQLite para almacenamiento local
- ✅ **Exportación a Excel**: Descarga reportes en formato XLSX
- ✅ **Multi-usuario**: Soporta múltiples usuarios simultáneamente
- ✅ **Análisis en Tiempo Real**: Gráficas interactivas con Chart.js

## 📋 Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd c:\xampp\htdocs\TML
```

### 2. Crear ambiente virtual (Recomendado)

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

## ▶️ Ejecutar la Aplicación

### Opción 1: Desde PowerShell

```bash
cd backend
python app.py
```

### Opción 2: Desde Windows CMD

```bash
cd backend
python app.py
```

La aplicación se ejecutará en: **http://localhost:5000**

## 🗂️ Estructura del Proyecto

```
TML/
├── backend/
│   ├── app.py                 # Aplicación Flask principal
│   ├── models.py              # Modelos de base de datos
│   ├── database.db            # Base de datos SQLite (generada)
│   ├── routes/
│   │   ├── api.py             # Endpoints de API
│   │   └── admin.py           # Endpoints de administrador
│   └── requirements.txt        # Dependencias
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   ├── mobile.css     # Estilos interfaz móvil
│   │   │   └── admin.css      # Estilos panel admin
│   │   └── js/
│   │       ├── mobile.js      # Lógica interfaz móvil
│   │       ├── history.js     # Lógica historial
│   │       └── admin.js       # Lógica panel admin
│   └── templates/
│       ├── mobile/
│       │   ├── index.html     # Cronómetro
│       │   └── history.html   # Historial
│       └── admin/
│           └── dashboard.html # Panel administrador
└── README.md                  # Este archivo
```

## 📱 Interfaz Móvil

### URL: http://localhost:5000/

**Funcionalidades:**
1. Ingresa el número de ruta
2. Presiona "Iniciar" para comenzar
3. Para cada etapa:
   - **▶ Iniciar**: Comienza el cronómetro
   - **⏹ Parar**: Detiene el cronómetro y guarda el tiempo
   - **↻ Reiniciar**: Limpia el tiempo de la etapa
4. Añade notas opcionales
5. Guarda la ruta completa

## 📊 Panel de Administrador

### URL: http://localhost:5000/dashboard

**Secciones:**

- **Dashboard**: Estadísticas generales y gráficas
- **Rutas**: Listado completo con filtros
- **Reportes**: Análisis por etapa y comparativas

**Filtros disponibles:**
- Por usuario
- Por estado (activa, completada, cancelada)
- Por fecha

**Descargar Excel:**
- Botón verde para exportar datos filtrados

## 🔌 API Endpoints

### Rutas

```
GET    /api/rutas                          # Listar rutas
POST   /api/rutas                          # Crear ruta
GET    /api/rutas/{id}                     # Obtener ruta específica
PUT    /api/rutas/{id}                     # Actualizar ruta
DELETE /api/rutas/{id}                     # Eliminar ruta
```

### Etapas

```
POST   /api/etapas/{id}/iniciar            # Iniciar cronómetro
POST   /api/etapas/{id}/parar              # Parar cronómetro
POST   /api/etapas/{id}/reiniciar          # Reiniciar etapa
```

### Análisis

```
GET    /api/estadisticas                   # Estadísticas generales
GET    /api/etapas-promedio                # Promedios por etapa
GET    /api/historial-diario               # Historial diario
```

### Admin

```
GET    /admin/rutas-con-etapas             # Todas las rutas con etapas
GET    /admin/descargar-excel              # Descargar Excel
GET    /admin/estadisticas-general         # Estadísticas completas
```

## 🎨 Temas de Color

- **Primario**: Azul (#4472C4)
- **Secundario**: Verde (#70AD47)
- **Peligro**: Rojo (#E74C3C)
- **Info**: Azul claro (#3498DB)

## 📈 Características Gráficas

### Dashboard
- Gráfico de barras: Promedios por etapa
- Gráfico de línea: Rutas por día

### Reportes
- Gráfico Radar: Comparativa de tiempos

## 🔒 Seguridad

Nota: La aplicación incluye un usuario por defecto. Para producción, implementar:
- Autenticación con contraseñas hasheadas
- Tokens JWT para API
- HTTPS

## 🐛 Solución de Problemas

### Error: Port 5000 ya está en uso

```bash
python app.py --port 5001
```

### Error: Módulo no encontrado

```bash
pip install -r requirements.txt
```

### Limpiar base de datos

Elimina el archivo `backend/database.db` y reinicia la aplicación.

## 📝 Notas

- Los datos se guardan automáticamente en SQLite
- Las gráficas se actualizan en tiempo real
- Soporta acceso simultáneo de múltiples usuarios

## 🤝 Soporte

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo.

## 📄 Licencia

Proyecto privado de TML. Todos los derechos reservados.

---

**Versión**: 1.0.0  
**Última actualización**: Mayo 2026

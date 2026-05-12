# 🚀 Guía Paso a Paso - Windows

## 📋 Requisitos
- Windows 7 o superior
- Python 3.8+ instalado (si no, descárgalo desde python.org)

## ✅ Verificar que Python está instalado

Abre PowerShell o CMD y ejecuta:
```
python --version
```

Si ves un número de versión (ej: Python 3.11.0), ¡está listo!

---

## 🎯 INSTALACIÓN (Primera vez)

### Paso 1️⃣: Ir a la carpeta del proyecto
```
cd C:\xampp\htdocs\TML
```

### Paso 2️⃣: Instalar dependencias
Simplemente **haz doble clic** en el archivo:
```
INSTALAR.bat
```

Espera a que termine (verás mensajes en PowerShell).
Presiona una tecla cuando pida.

**Alternativa manual:**
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## ▶️ EJECUTAR LA APLICACIÓN

### Opción 1️⃣: Método más fácil
**Haz doble clic** en:
```
EJECUTAR.bat
```

### Opción 2️⃣: Desde PowerShell
```
cd C:\xampp\htdocs\TML
venv\Scripts\activate
python run.py
```

### Opción 3️⃣: Desde CMD
```
cd C:\xampp\htdocs\TML
venv\Scripts\activate.bat
python run.py
```

---

## 🌐 Acceder a la Aplicación

Una vez ejecutando, verás:
```
========================================
  TML - Sistema de Medición de Tiempos
========================================
📱 Interfaz Móvil:  http://localhost:5000/
📊 Panel Admin:     http://localhost:5000/dashboard
📋 Historial:       http://localhost:5000/historial
========================================
```

**Abre en tu navegador:**
- 📱 Interfaz Móvil: http://localhost:5000/
- 📊 Panel Admin: http://localhost:5000/dashboard
- 📋 Historial: http://localhost:5000/historial

---

## 🎮 USAR LA APLICACIÓN

### En la Interfaz Móvil (http://localhost:5000/)

1. **Ingresa número de ruta**
   - Escribe: `RUTA-001`
   - Presiona: `Iniciar`

2. **Mide las etapas**
   - Presiona `▶ Iniciar` en la etapa
   - El cronómetro comienza
   - Presiona `⏹ Parar` para terminar
   - Presiona `↻ Reiniciar` si lo necesitas

3. **Guarda la ruta**
   - Opcionalmente añade notas
   - Presiona `✓ Guardar Ruta`
   - O `✗ Cancelar` si deseas descartar

### En el Panel Admin (http://localhost:5000/dashboard)

- **Dashboard**: Estadísticas y gráficas
- **Rutas**: Tabla de todas las rutas
  - Filtra por usuario, estado, fecha
  - Presiona `📥 Descargar Excel`
- **Reportes**: Análisis por etapa

---

## 📊 Descargar Datos en Excel

1. Ve a: http://localhost:5000/dashboard
2. Haz clic en la sección **Rutas**
3. (Opcional) Aplica filtros
4. Presiona **📥 Descargar Excel**
5. Se descargará un archivo `.xlsx` con los datos

---

## 🔧 Solución de Problemas

### ❌ Error: "Port 5000 already in use"

El puerto 5000 está siendo usado.

**Solución:**
```powershell
# Abre PowerShell como administrador y ejecuta:
Stop-Process -Name python -Force
```

Luego ejecuta `EJECUTAR.bat` nuevamente.

**Alternativa:** Cambiar puerto
- Edita `run.py`
- Cambia: `app.run(port=5001)`
- Ejecuta nuevamente

---

### ❌ Error: "ModuleNotFoundError"

Las dependencias no están instaladas.

**Solución:**
```
venv\Scripts\activate
pip install -r requirements.txt
```

---

### ❌ Error: "Python is not recognized"

Python no está en el PATH.

**Solución:**
1. Desinstala Python
2. Vuelve a instalarlo
3. ✅ Marca la opción: "Add Python to PATH"
4. Reinicia PowerShell

---

### ❌ La aplicación no carga en navegador

**Solución:**
1. Verifica que PowerShell muestre "Running on http://localhost:5000"
2. Espera 3-5 segundos después de ejecutar
3. Intenta en otro navegador (Chrome, Edge)
4. Borra caché: Ctrl+Shift+Del

---

## 🗄️ Datos de Ejemplo

Para agregar datos de demostración:

```
python populate_demo.py
```

Esto creará:
- 1 usuario demo
- 5 rutas de ejemplo
- 25 etapas con tiempos

**Credenciales:**
- Email: `demo@tml.local`
- Password: `demo123`

---

## 🔄 Resetear Todo

Para limpiar la BD y empezar de cero:

```
python mantenimiento.py
```

Selecciona opción 3 (Resetear todo)

O manualmente:
1. Elimina: `backend/database.db`
2. Ejecuta: `EJECUTAR.bat`

---

## 🚫 Detener la Aplicación

En la ventana de PowerShell donde está ejecutando:
```
Presiona: Ctrl + C
```

---

## 📁 Estructura de Carpetas

```
C:\xampp\htdocs\TML\
├── INSTALAR.bat          ← Ejecutar PRIMERO
├── EJECUTAR.bat          ← Ejecutar para iniciar
├── backend/              ← Lógica del servidor
│   ├── app.py
│   ├── models.py
│   └── database.db       ← Base de datos (creada automáticamente)
├── frontend/             ← Interfaz web
│   ├── templates/        ← Archivos HTML
│   └── static/           ← CSS y JavaScript
└── venv/                 ← Ambiente virtual (creado automáticamente)
```

---

## 📞 Ayuda Rápida

**¿Cómo acceder desde otro dispositivo?**
- En lugar de `localhost`, usa la IP de tu PC
- Ejemplo: `http://192.168.1.10:5000/`
- Para saber tu IP: `ipconfig` en PowerShell

**¿Cómo cambiar el puerto?**
- Edita `run.py`
- Busca: `app.run(port=5000)`
- Cambia a: `app.run(port=8000)`

**¿Cómo ver logs?**
- Aparecen automáticamente en PowerShell
- Busca líneas con rojo si hay errores

**¿Puedo acceder en mi móvil?**
- Sí, usa: `http://<IP-de-tu-PC>:5000/`
- La interfaz es responsiva

---

## ✨ Características principales

✅ Cronómetro multietapa  
✅ Interfaz responsiva (móvil y desktop)  
✅ Panel de administrador con gráficas  
✅ Exportación a Excel  
✅ Almacenamiento en base de datos  
✅ Multi-usuario  

---

## 📚 Documentación Adicional

- **INICIO_RAPIDO.md** - Guía rápida
- **README.md** - Documentación completa
- **ESTRUCTURA.md** - Estructura del proyecto

---

¡Listo! 🎉 La aplicación debería estar funcionando.

Cualquier duda, revisa los archivos .md o los comentarios en el código.

**¡Diviértete usando TML!** 🚀

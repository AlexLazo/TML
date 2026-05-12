# GUÍA RÁPIDA DE INICIO - TML

## 🚀 Pasos Rápidos (Windows)

### Primera vez:
1. Abre PowerShell en la carpeta `C:\xampp\htdocs\TML`
2. Ejecuta: `INSTALAR.bat`
3. Espera a que termine la instalación

### Siguientes veces:
1. Haz doble clic en `EJECUTAR.bat`
2. Abre tu navegador en: http://localhost:5000

---

## 📱 URLs principales

- **Interfaz Móvil (Cronómetro)**: http://localhost:5000/
- **Historial de Rutas**: http://localhost:5000/historial
- **Panel de Administrador**: http://localhost:5000/dashboard

---

## 🎯 Workflow Típico

1. **En el móvil (interfaz principal)**:
   - Ingresa número de ruta (ej: RUTA-001)
   - Presiona "Iniciar"
   - Presiona ▶ para comenzar cada etapa
   - Presiona ⏹ para terminar
   - Presiona ✓ Guardar Ruta al finalizar

2. **En administración (panel dashboard)**:
   - Ve estadísticas en tiempo real
   - Visualiza gráficas de desempeño
   - Descarga datos en Excel

---

## 🔧 Solución de Problemas

**Error: "Port 5000 in use"**
- Abre otra terminal PowerShell y ejecuta:
  ```powershell
  Stop-Process -Name python -Force
  ```

**Error: "ModuleNotFoundError"**
- Ejecuta nuevamente: `pip install -r requirements.txt`

**Limpiar datos**
- Elimina la carpeta `.venv` completa
- Elimina `database.db` en `backend/`
- Ejecuta `INSTALAR.bat` nuevamente

---

## 📊 Funcionalidades Principales

✅ Cronómetro multietapa  
✅ 5 etapas configurables  
✅ Interfaz móvil responsiva  
✅ Panel admin con gráficas  
✅ Exportación a Excel  
✅ Almacenamiento en BD SQLite  
✅ Multi-usuario  

---

**¿Problemas?** Revisa el README.md para más detalles.

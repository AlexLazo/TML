@echo off
echo.
echo ========================================
echo   TML - Instalacion de Dependencias
echo ========================================
echo.

REM Crear ambiente virtual
echo [1/3] Creando ambiente virtual...
python -m venv venv

REM Activar ambiente virtual
call venv\Scripts\activate.bat

REM Instalar dependencias
echo [2/3] Instalando dependencias...
pip install -r requirements.txt

REM Crear base de datos
echo [3/3] Inicializando base de datos...
python -c "import sys; sys.path.insert(0, 'backend'); from app import app; app.app_context().push()"

echo.
echo ========================================
echo   Instalacion completada!
echo ========================================
echo.
echo Para ejecutar la aplicacion:
echo   1. Ejecuta: EJECUTAR.bat
echo   O manualmente:
echo   2. Activar venv: venv\Scripts\activate
echo   3. Ejecutar: python run.py
echo.
pause

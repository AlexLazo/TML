#!/bin/bash

# Script para Linux/Mac

# Crear ambiente virtual si no existe
if [ ! -d "venv" ]; then
    echo "Creando ambiente virtual..."
    python3 -m venv venv
fi

# Activar ambiente virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar aplicacion
python run.py

#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para ejecutar la aplicación TML
"""

import os
import sys
from pathlib import Path

# Agregar el backend al path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

from app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True') == 'True'
    
    print("=" * 60)
    print("🚀 Iniciando TML - Sistema de Medición de Tiempos")
    print("=" * 60)
    print(f"📱 Interfaz Móvil:  http://localhost:{port}/")
    print(f"📊 Panel Admin:     http://localhost:{port}/dashboard")
    print(f"📋 Historial:       http://localhost:{port}/historial")
    print("=" * 60)
    print("Presiona Ctrl+C para detener el servidor")
    print("=" * 60)
    
    app.run(debug=debug, port=port, host='0.0.0.0')

"""
Script para agregar datos de ejemplo a la base de datos.
Ejecutar: python populate_demo.py
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Agregar backend al path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

from app import app
from models import db, Usuario, Ruta, Etapa, ConfiguracionEtapa
import random

def seed_demo_data():
    """Agrega datos de ejemplo a la BD"""
    
    with app.app_context():
        # Crear usuario demo si no existe
        usuario = Usuario.query.filter_by(email='demo@tml.local').first()
        if not usuario:
            usuario = Usuario(
                nombre='Usuario Demo',
                email='demo@tml.local',
                password='demo123',
                es_admin=True,
                activo=True
            )
            db.session.add(usuario)
            db.session.flush()
            print("✓ Usuario demo creado")
        
        # Crear rutas de ejemplo
        etapas_nombres = ['Matinal', 'Impresión de Previsita', 'Conteo de Carga', 'Check de Salida', 'Botón de Pánico']
        
        for i in range(1, 6):
            ruta = Ruta(
                usuario_id=usuario.id,
                numero_ruta=f'RUTA-{i:03d}',
                fecha=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
                estado='completada',
                notas=f'Ruta de ejemplo {i}'
            )
            db.session.add(ruta)
            db.session.flush()
            
            # Agregar etapas con tiempos aleatorios
            for idx, nombre_etapa in enumerate(etapas_nombres, 1):
                duracion = random.randint(5, 25) * 60  # Entre 5 y 25 minutos
                
                etapa = Etapa(
                    ruta_id=ruta.id,
                    nombre=nombre_etapa,
                    orden=idx,
                    tiempo_inicio=ruta.fecha,
                    tiempo_fin=ruta.fecha + timedelta(seconds=duracion),
                    duracion_segundos=duracion,
                    completada=True
                )
                db.session.add(etapa)
        
        db.session.commit()
        print("✓ Rutas de ejemplo creadas")
        print("\n📊 Datos agregados:")
        print(f"   - 1 usuario demo")
        print(f"   - 5 rutas de ejemplo")
        print(f"   - 25 etapas con tiempos aleatorios")
        print("\n🔐 Credenciales de prueba:")
        print("   Email: demo@tml.local")
        print("   Password: demo123")

if __name__ == '__main__':
    seed_demo_data()

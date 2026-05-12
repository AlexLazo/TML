"""
Mantenimiento de TML - Comandos útiles
"""

import subprocess
import sys
import os

def limpiar_db():
    """Elimina la base de datos y la regenera"""
    db_path = 'backend/database.db'
    if os.path.exists(db_path):
        os.remove(db_path)
        print("✓ Base de datos eliminada")
    else:
        print("ℹ No hay base de datos para eliminar")

def generar_demo():
    """Genera datos de demostración"""
    subprocess.run([sys.executable, 'populate_demo.py'])

def resetear_todo():
    """Limpia todo y regenera"""
    print("Reseteando aplicación...")
    limpiar_db()
    generar_demo()
    print("\n✓ Aplicación resetada. Ejecuta EJECUTAR.bat para iniciar")

if __name__ == '__main__':
    print("=" * 50)
    print("  TML - Mantenimiento")
    print("=" * 50)
    print("\nOpciones:")
    print("1 - Limpiar base de datos")
    print("2 - Generar datos de demostración")
    print("3 - Resetear todo")
    print("0 - Salir")
    
    opcion = input("\nSelecciona una opción: ").strip()
    
    if opcion == '1':
        limpiar_db()
    elif opcion == '2':
        generar_demo()
    elif opcion == '3':
        resetear_todo()
    elif opcion == '0':
        print("Adios!")
    else:
        print("Opción inválida")

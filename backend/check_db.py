import sys
sys.path.insert(0, '.')
from app import app
from models import Ruta, RutaFija

with app.app_context():
    rutas = Ruta.query.all()
    print('Total rutas', len(rutas))
    supervisors = set()
    contractors = set()
    faltantes = 0
    for ruta in rutas:
        rf = RutaFija.query.filter_by(numero_ruta=ruta.numero_ruta).first()
        if rf:
            supervisors.add(rf.supervisor or 'Sin supervisor')
            contractors.add(rf.contratista or 'Sin contratista')
        else:
            faltantes += 1
    print('Distinct supervisors', supervisors)
    print('Distinct contractors', contractors)
    print('routes without RutaFija', faltantes)
    print('Distinct RutaFija count', RutaFija.query.count())

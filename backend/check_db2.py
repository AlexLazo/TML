import sys
sys.path.insert(0, '.')
from app import app
from models import Ruta, RutaFija
from routes.admin import _duracion_etapa

with app.app_context():
    rutas = Ruta.query.order_by(Ruta.fecha.desc()).all()
    supervisors = {}
    contractors = {}
    for ruta in rutas:
        rf = RutaFija.query.filter_by(numero_ruta=ruta.numero_ruta).first()
        supervisor = rf.supervisor if rf and rf.supervisor else 'Sin supervisor'
        contratista = rf.contratista if rf and rf.contratista else 'Sin contratista'
        total = sum(etapa.duracion_segundos or 0 for etapa in ruta.etapas)
        tiempo_fila = _duracion_etapa(ruta, 'Tiempo en Fila')
        for bucket, nombre in ((supervisors, supervisor), (contractors, contratista)):
            if nombre not in bucket:
                bucket[nombre] = {'rutas': 0, 'completadas': 0, 'tiempo_total': 0, 'con_tiempo': 0, 'cola_total': 0, 'cola_count': 0, 'tiempos_totales': [], 'tiempos_cola': [], 'etapas': {}}
            bucket[nombre]['rutas'] += 1
            if ruta.estado == 'completada':
                bucket[nombre]['completadas'] += 1
            if total:
                bucket[nombre]['tiempo_total'] += total
                bucket[nombre]['con_tiempo'] += 1
                bucket[nombre]['tiempos_totales'].append(total)
            if tiempo_fila is not None:
                bucket[nombre]['cola_total'] += tiempo_fila
                bucket[nombre]['cola_count'] += 1
                bucket[nombre]['tiempos_cola'].append(tiempo_fila)
            for etapa in ruta.etapas:
                if etapa.duracion_segundos is None:
                    continue
                etapa_nombre = etapa.nombre
                if etapa_nombre not in bucket[nombre]['etapas']:
                    bucket[nombre]['etapas'][etapa_nombre] = {'total': 0, 'count': 0}
                bucket[nombre]['etapas'][etapa_nombre]['total'] += etapa.duracion_segundos
                bucket[nombre]['etapas'][etapa_nombre]['count'] += 1
    print('Supervisor count', len(supervisors))
    print('Contractor count', len(contractors))
    print('Supervisor names', list(supervisors.keys())[:10])
    print('Contractor names', list(contractors.keys())[:10])
    print('Supervisor sample', {k:v['rutas'] for k,v in supervisors.items()})
    print('Contractor sample', {k:v['rutas'] for k,v in contractors.items()})

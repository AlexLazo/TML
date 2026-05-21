from flask import Blueprint, jsonify, request, session
from models import db, Usuario, Ruta, Etapa, ConfiguracionEtapa
from datetime import datetime, timedelta
import json
import re

api_bp = Blueprint('api', __name__)


def _fmt_segundos(segundos):
    segundos = int(segundos or 0)
    return f"{segundos // 3600:02d}:{(segundos % 3600) // 60:02d}:{segundos % 60:02d}"


def _duracion_etapa(ruta, nombre):
    etapa = next((etapa for etapa in ruta.etapas if etapa.nombre == nombre), None)
    return etapa.duracion_segundos if etapa and etapa.duracion_segundos is not None else None


def _configuraciones_etapas_activas():
    etapas = ConfiguracionEtapa.query.filter_by(activa=True).order_by(ConfiguracionEtapa.orden).all()
    etapas = [etapa for etapa in etapas if etapa.nombre != 'Impresión de Previsita']
    if not any(etapa.nombre == 'Tiempo en Fila' for etapa in etapas):
        etapas.append(ConfiguracionEtapa(nombre='Tiempo en Fila', orden=5, descripcion='Tiempo en fila antes de salida'))
    return etapas


def _serializar_etapas(ruta):
    etapas = [etapa for etapa in sorted(ruta.etapas, key=lambda x: x.orden) if etapa.nombre != 'Impresión de Previsita']
    return [
        {
            'id': etapa.id,
            'nombre': etapa.nombre,
            'orden': etapa.orden,
            'tiempo_inicio': etapa.tiempo_inicio.isoformat() if etapa.tiempo_inicio else None,
            'tiempo_fin': etapa.tiempo_fin.isoformat() if etapa.tiempo_fin else None,
            'duracion_segundos': etapa.duracion_segundos,
            'duracion_formateada': etapa.get_duracion_formateada(),
            'completada': etapa.completada
        }
        for etapa in etapas
    ]


# ==================== ENDPOINTS DE RUTAS ====================

@api_bp.route('/rutas', methods=['GET'])
def obtener_rutas():
    """Obtiene todas las rutas"""
    if session.get('rol') not in ('admin', 'supervisor'):
        return jsonify({'error': 'No autorizado'}), 401

    usuario_id = request.args.get('usuario_id', type=int)
    estado = request.args.get('estado')
    
    query = Ruta.query
    
    if usuario_id:
        query = query.filter_by(usuario_id=usuario_id)
    if estado:
        query = query.filter_by(estado=estado)
    
    rutas = query.all()
    
    resultado = []
    for ruta in rutas:
        resultado.append({
            'id': ruta.id,
            'numero_ruta': ruta.numero_ruta,
            'fecha': ruta.fecha.isoformat(),
            'estado': ruta.estado,
            'usuario_id': ruta.usuario_id,
            'etapas_completadas': sum(1 for e in ruta.etapas if e.completada),
            'total_etapas': len(ruta.etapas)
        })
    
    return jsonify(resultado)


@api_bp.route('/rutas', methods=['POST'])
def crear_ruta():
    """Crea una nueva ruta"""
    data = request.get_json(silent=True) or {}
    numero_ruta = (data.get('numero_ruta') or '').strip().upper()

    if not re.fullmatch(r'DS00([0-9]{1,2}|[A-Z]{1,2})', numero_ruta):
        return jsonify({'error': 'La ruta debe usar DS00 seguido de maximo 2 numeros o 2 letras'}), 400
    
    nueva_ruta = Ruta(
        usuario_id=data.get('usuario_id'),
        numero_ruta=numero_ruta,
        notas=data.get('notas', '')
    )
    
    db.session.add(nueva_ruta)
    db.session.flush()
    
    # Crear etapas por defecto
    etapas_config = _configuraciones_etapas_activas()
    for orden, config in enumerate(etapas_config, 1):
        etapa = Etapa(
            ruta_id=nueva_ruta.id,
            nombre=config.nombre,
            orden=orden
        )
        db.session.add(etapa)
    
    db.session.commit()
    
    return jsonify({
        'id': nueva_ruta.id,
        'numero_ruta': nueva_ruta.numero_ruta,
        'fecha': nueva_ruta.fecha.isoformat()
    }), 201


@api_bp.route('/rutas/<int:ruta_id>', methods=['GET'])
def obtener_ruta(ruta_id):
    """Obtiene una ruta específica con sus etapas"""
    ruta = Ruta.query.get_or_404(ruta_id)
    
    etapas = _serializar_etapas(ruta)
    
    return jsonify({
        'id': ruta.id,
        'numero_ruta': ruta.numero_ruta,
        'fecha': ruta.fecha.isoformat(),
        'estado': ruta.estado,
        'usuario_id': ruta.usuario_id,
        'etapas': etapas,
        'notas': ruta.notas
    })


@api_bp.route('/rutas/<int:ruta_id>', methods=['PUT'])
def actualizar_ruta(ruta_id):
    """Actualiza una ruta"""
    ruta = Ruta.query.get_or_404(ruta_id)
    data = request.get_json()
    
    if 'estado' in data:
        if data['estado'] == 'completada':
            activa = _etapa_activa(ruta)
            if activa:
                return jsonify({'error': f'Primero debes parar la etapa activa: {activa.nombre}'}), 400
            pendientes = [etapa.nombre for etapa in ruta.etapas if not etapa.completada and etapa.nombre != 'Tiempo en Fila']
            if pendientes:
                return jsonify({'error': 'No puedes guardar la ruta sin completar todas las etapas'}), 400

            # Calcular Tiempo en Fila como el tiempo después de Botón de Pánico hasta el cierre de la ruta.
            etapa_tiempo_fila = _etapa_por_nombre(ruta, 'Tiempo en Fila')
            etapa_panico = _etapa_por_nombre(ruta, 'Botón de Pánico')
            if etapa_tiempo_fila and not etapa_tiempo_fila.completada and etapa_panico and etapa_panico.tiempo_fin:
                etapa_tiempo_fila.tiempo_inicio = etapa_panico.tiempo_fin
                etapa_tiempo_fila.tiempo_fin = datetime.utcnow()
                duracion = etapa_tiempo_fila.tiempo_fin - etapa_tiempo_fila.tiempo_inicio
                etapa_tiempo_fila.duracion_segundos = int(duracion.total_seconds())
                etapa_tiempo_fila.completada = True

        ruta.estado = data['estado']
    if 'notas' in data:
        ruta.notas = data['notas']
    
    db.session.commit()
    
    return jsonify({'mensaje': 'Ruta actualizada'})


@api_bp.route('/rutas/<int:ruta_id>', methods=['DELETE'])
def eliminar_ruta(ruta_id):
    """Elimina una ruta"""
    if session.get('rol') != 'admin':
        return jsonify({'error': 'No autorizado'}), 401

    ruta = Ruta.query.get_or_404(ruta_id)
    db.session.delete(ruta)
    db.session.commit()
    
    return jsonify({'mensaje': 'Ruta eliminada'})


# ==================== ENDPOINTS DE ETAPAS ====================

def _etapas_de_ruta(etapa):
    return sorted(etapa.ruta.etapas, key=lambda x: x.orden)


def _etapa_por_nombre(ruta, nombre):
    return next((etapa for etapa in ruta.etapas if etapa.nombre == nombre), None)


def _etapa_activa(ruta, excluir_id=None):
    for item in ruta.etapas:
        if excluir_id is not None and item.id == excluir_id:
            continue
        if item.tiempo_inicio is not None and item.tiempo_fin is None and not item.completada:
            return item
    return None


@api_bp.route('/etapas/<int:etapa_id>/iniciar', methods=['POST'])
def iniciar_etapa(etapa_id):
    """Inicia el cronómetro de una etapa"""
    etapa = Etapa.query.get_or_404(etapa_id)
    
    if etapa.ruta.estado != 'activa':
        return jsonify({'error': 'La ruta ya no esta activa'}), 400

    if etapa.completada or etapa.tiempo_fin is not None:
        return jsonify({'error': 'La etapa ya fue finalizada y no puede iniciarse de nuevo'}), 400

    if etapa.tiempo_inicio is not None:
        return jsonify({'error': 'La etapa ya ha sido iniciada'}), 400

    activa = _etapa_activa(etapa.ruta, excluir_id=etapa.id)
    if activa:
        return jsonify({'error': f'Primero debes parar la etapa activa: {activa.nombre}'}), 400

    for anterior in _etapas_de_ruta(etapa):
        if anterior.orden >= etapa.orden:
            break
        if not anterior.completada:
            return jsonify({'error': f'Primero debes finalizar la etapa anterior: {anterior.nombre}'}), 400
    
    etapa.tiempo_inicio = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'id': etapa.id,
        'nombre': etapa.nombre,
        'tiempo_inicio': etapa.tiempo_inicio.isoformat()
    })


@api_bp.route('/etapas/<int:etapa_id>/parar', methods=['POST'])
def parar_etapa(etapa_id):
    """Para el cronómetro de una etapa"""
    etapa = Etapa.query.get_or_404(etapa_id)
    
    if etapa.ruta.estado != 'activa':
        return jsonify({'error': 'La ruta ya no esta activa'}), 400

    if etapa.completada or etapa.tiempo_fin is not None:
        return jsonify({'error': 'La etapa ya fue finalizada'}), 400

    if etapa.tiempo_inicio is None:
        return jsonify({'error': 'La etapa no ha sido iniciada'}), 400
    
    etapa.tiempo_fin = datetime.utcnow()
    duracion = etapa.tiempo_fin - etapa.tiempo_inicio
    etapa.duracion_segundos = int(duracion.total_seconds())
    etapa.completada = True
    
    db.session.commit()
    
    return jsonify({
        'id': etapa.id,
        'nombre': etapa.nombre,
        'tiempo_fin': etapa.tiempo_fin.isoformat(),
        'duracion_segundos': etapa.duracion_segundos,
        'duracion_formateada': etapa.get_duracion_formateada()
    })


@api_bp.route('/etapas/<int:etapa_id>/reiniciar', methods=['POST'])
def reiniciar_etapa(etapa_id):
    """Reinicia una etapa (limpia los tiempos)"""
    etapa = Etapa.query.get_or_404(etapa_id)
    
    if etapa.ruta.estado != 'activa':
        return jsonify({'error': 'La ruta ya no esta activa'}), 400

    if etapa.completada or etapa.tiempo_fin is not None:
        return jsonify({'error': 'La etapa ya fue finalizada y no puede reiniciarse'}), 400

    for siguiente in _etapas_de_ruta(etapa):
        if siguiente.orden <= etapa.orden:
            continue
        if siguiente.tiempo_inicio is not None or siguiente.completada:
            return jsonify({'error': 'No puedes reiniciar una etapa si ya avanzaste a etapas posteriores'}), 400

    etapa.tiempo_inicio = None
    etapa.tiempo_fin = None
    etapa.duracion_segundos = None
    etapa.completada = False
    
    db.session.commit()
    
    return jsonify({
        'id': etapa.id,
        'mensaje': 'Etapa reiniciada'
    })


# ==================== ENDPOINTS DE ANÁLISIS ====================

@api_bp.route('/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """Obtiene estadísticas generales"""
    usuario_id = request.args.get('usuario_id', type=int)
    
    query = Ruta.query
    if usuario_id:
        query = query.filter_by(usuario_id=usuario_id)
    
    rutas_totales = query.count()
    rutas_completadas = query.filter_by(estado='completada').count()
    
    # Promedios por etapa
    etapas_stats = {}
    etapas = Etapa.query.filter(Etapa.duracion_segundos.isnot(None)).all()
    
    for etapa in etapas:
        nombre = etapa.nombre
        if nombre not in etapas_stats:
            etapas_stats[nombre] = {'tiempos': [], 'promedio': 0}
        etapas_stats[nombre]['tiempos'].append(etapa.duracion_segundos)
    
    for nombre, data in etapas_stats.items():
        if data['tiempos']:
            promedio = sum(data['tiempos']) / len(data['tiempos'])
            data['promedio'] = int(promedio)
            data['cantidad'] = len(data['tiempos'])
    
    return jsonify({
        'rutas_totales': rutas_totales,
        'rutas_completadas': rutas_completadas,
        'etapas_stats': etapas_stats
    })


@api_bp.route('/etapas-promedio', methods=['GET'])
def obtener_etapas_promedio():
    """Obtiene promedios de tiempo por etapa"""
    if session.get('rol') not in ('admin', 'supervisor'):
        return jsonify({'error': 'No autorizado'}), 401

    usuario_id = request.args.get('usuario_id', type=int)
    
    etapa_query = Etapa.query.filter(Etapa.duracion_segundos.isnot(None))
    if usuario_id:
        etapa_query = etapa_query.join(Ruta).filter(Ruta.usuario_id == usuario_id)
    
    rutas_query = Ruta.query
    if usuario_id:
        rutas_query = rutas_query.filter(Ruta.usuario_id == usuario_id)
    
    etapas = etapa_query.all()
    rutas = rutas_query.all()
    
    stats = {}
    for etapa in etapas:
        nombre = etapa.nombre
        if nombre == 'Impresión de Previsita':
            continue
        stats.setdefault(nombre, []).append(etapa.duracion_segundos)
    
    resultado = {}
    for nombre, tiempos in stats.items():
        promedio = sum(tiempos) / len(tiempos)
        minimo = min(tiempos)
        maximo = max(tiempos)
        resultado[nombre] = {
            'promedio': int(promedio),
            'minimo': minimo,
            'maximo': maximo,
            'cantidad': len(tiempos)
        }
    
    return jsonify(resultado)


@api_bp.route('/historial-diario', methods=['GET'])
def obtener_historial_diario():
    """Obtiene el historial de rutas por día"""
    if session.get('rol') not in ('admin', 'supervisor'):
        return jsonify({'error': 'No autorizado'}), 401

    usuario_id = request.args.get('usuario_id', type=int)
    dias = request.args.get('dias', default=7, type=int)
    
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    query = Ruta.query.filter(Ruta.fecha >= fecha_inicio)
    if usuario_id:
        query = query.filter_by(usuario_id=usuario_id)
    
    rutas = query.all()
    
    # Agrupar por fecha
    historial = {}
    for ruta in rutas:
        fecha_str = ruta.fecha.strftime('%Y-%m-%d')
        if fecha_str not in historial:
            historial[fecha_str] = {'total': 0, 'completadas': 0}
        historial[fecha_str]['total'] += 1
        if ruta.estado == 'completada':
            historial[fecha_str]['completadas'] += 1
    
    return jsonify(historial)

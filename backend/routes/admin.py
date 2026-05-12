from flask import Blueprint, jsonify, request, send_file, session
from models import db, Ruta, Etapa, Usuario, RutaFija
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from datetime import datetime, timedelta
import io
import os

admin_bp = Blueprint('admin', __name__)


@admin_bp.before_request
def requerir_admin():
    if not session.get('admin_id'):
        return jsonify({'error': 'No autorizado'}), 401


def _fmt_segundos(segundos):
    segundos = int(segundos or 0)
    return f"{segundos // 3600:02d}:{(segundos % 3600) // 60:02d}:{segundos % 60:02d}"


def _ruta_fija(numero_ruta):
    return RutaFija.query.filter_by(numero_ruta=numero_ruta).first()


def _ruta_payload(ruta):
    ruta_fija = _ruta_fija(ruta.numero_ruta)
    etapas_info = []
    tiempo_total = 0

    for etapa in sorted(ruta.etapas, key=lambda x: x.orden):
        tiempo = etapa.duracion_segundos or 0
        tiempo_total += tiempo
        etapas_info.append({
            'nombre': etapa.nombre,
            'duracion_segundos': tiempo,
            'duracion_formateada': etapa.get_duracion_formateada(),
            'completada': etapa.completada
        })

    return {
        'id': ruta.id,
        'numero_ruta': ruta.numero_ruta,
        'usuario': ruta.usuario.nombre if ruta.usuario else 'Sin asignar',
        'fecha': ruta.fecha.isoformat(),
        'estado': ruta.estado,
        'etapas': etapas_info,
        'tiempo_total_segundos': tiempo_total,
        'tiempo_total_formateado': _fmt_segundos(tiempo_total),
        'notas': ruta.notas,
        'supervisor': ruta_fija.supervisor if ruta_fija else 'Sin supervisor',
        'contratista': ruta_fija.contratista if ruta_fija else 'Sin contratista',
        'canal': ruta_fija.canal if ruta_fija else '-',
        'estatus_fijo': ruta_fija.estatus if ruta_fija else '-'
    }


@admin_bp.route('/rutas-con-etapas', methods=['GET'])
def obtener_rutas_con_etapas():
    """Obtiene todas las rutas con sus etapas para admin"""
    filtro_usuario = request.args.get('usuario_id', type=int)
    filtro_estado = request.args.get('estado')
    filtro_fecha = request.args.get('fecha')
    filtro_supervisor = request.args.get('supervisor')
    filtro_contratista = request.args.get('contratista')
    
    query = Ruta.query
    
    if filtro_usuario:
        query = query.filter_by(usuario_id=filtro_usuario)
    if filtro_estado:
        query = query.filter_by(estado=filtro_estado)
    if filtro_fecha:
        fecha_obj = datetime.strptime(filtro_fecha, '%Y-%m-%d')
        fecha_siguiente = fecha_obj + timedelta(days=1)
        query = query.filter(Ruta.fecha >= fecha_obj, Ruta.fecha < fecha_siguiente)
    if filtro_supervisor:
        rutas_supervisor = db.session.query(RutaFija.numero_ruta).filter(RutaFija.supervisor == filtro_supervisor)
        query = query.filter(Ruta.numero_ruta.in_(rutas_supervisor))
    if filtro_contratista:
        rutas_contratista = db.session.query(RutaFija.numero_ruta).filter(RutaFija.contratista == filtro_contratista)
        query = query.filter(Ruta.numero_ruta.in_(rutas_contratista))
    
    rutas = query.order_by(Ruta.fecha.desc()).all()
    
    return jsonify([_ruta_payload(ruta) for ruta in rutas])


@admin_bp.route('/descargar-excel', methods=['GET'])
def descargar_excel():
    """Descarga las rutas en formato Excel"""
    filtro_usuario = request.args.get('usuario_id', type=int)
    filtro_estado = request.args.get('estado')
    filtro_fecha = request.args.get('fecha')
    filtro_supervisor = request.args.get('supervisor')
    filtro_contratista = request.args.get('contratista')
    
    query = Ruta.query
    
    if filtro_usuario:
        query = query.filter_by(usuario_id=filtro_usuario)
    if filtro_estado:
        query = query.filter_by(estado=filtro_estado)
    if filtro_fecha:
        fecha_obj = datetime.strptime(filtro_fecha, '%Y-%m-%d')
        fecha_siguiente = fecha_obj + timedelta(days=1)
        query = query.filter(Ruta.fecha >= fecha_obj, Ruta.fecha < fecha_siguiente)
    if filtro_supervisor:
        rutas_supervisor = db.session.query(RutaFija.numero_ruta).filter(RutaFija.supervisor == filtro_supervisor)
        query = query.filter(Ruta.numero_ruta.in_(rutas_supervisor))
    if filtro_contratista:
        rutas_contratista = db.session.query(RutaFija.numero_ruta).filter(RutaFija.contratista == filtro_contratista)
        query = query.filter(Ruta.numero_ruta.in_(rutas_contratista))
    
    rutas = query.order_by(Ruta.fecha.desc()).all()
    
    # Crear libro de Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Rutas"
    
    # Estilos
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Encabezados
    headers = ['ID', 'Ruta', 'Supervisor', 'Contratista', 'Canal', 'Usuario', 'Fecha', 'Estado', 'Matinal', 'Impresión', 'Conteo', 'Check Salida', 'Pánico', 'Tiempo Total', 'Notas']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = border
        cell.alignment = Alignment(horizontal='center', vertical='center')
    
    # Datos
    row = 2
    for ruta in rutas:
        ruta_fija = _ruta_fija(ruta.numero_ruta)
        # Obtener duraciones de etapas
        etapas_duracion = {}
        for etapa in ruta.etapas:
            etapas_duracion[etapa.nombre] = etapa.get_duracion_formateada() if etapa.duracion_segundos else "-"
        
        # Calcular tiempo total
        tiempo_total = sum(etapa.duracion_segundos or 0 for etapa in ruta.etapas)
        tiempo_total_fmt = f"{tiempo_total // 3600:02d}:{(tiempo_total % 3600) // 60:02d}:{tiempo_total % 60:02d}"
        
        datos = [
            ruta.id,
            ruta.numero_ruta,
            ruta_fija.supervisor if ruta_fija else '',
            ruta_fija.contratista if ruta_fija else '',
            ruta_fija.canal if ruta_fija else '',
            ruta.usuario.nombre if ruta.usuario else 'Sin asignar',
            ruta.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            ruta.estado,
            etapas_duracion.get('Matinal', '-'),
            etapas_duracion.get('Impresión de Previsita', '-'),
            etapas_duracion.get('Conteo de Carga', '-'),
            etapas_duracion.get('Check de Salida', '-'),
            etapas_duracion.get('Botón de Pánico', '-'),
            tiempo_total_fmt,
            ruta.notas or ''
        ]
        
        for col, valor in enumerate(datos, 1):
            cell = ws.cell(row=row, column=col, value=valor)
            cell.border = border
            cell.alignment = Alignment(horizontal='center', vertical='center')
        
        row += 1
    
    # Ajustar anchos de columna
    ws.column_dimensions['A'].width = 8
    ws.column_dimensions['B'].width = 15
    ws.column_dimensions['C'].width = 15
    ws.column_dimensions['D'].width = 20
    ws.column_dimensions['E'].width = 12
    ws.column_dimensions['F'].width = 12
    ws.column_dimensions['G'].width = 12
    ws.column_dimensions['H'].width = 12
    ws.column_dimensions['I'].width = 12
    ws.column_dimensions['J'].width = 12
    ws.column_dimensions['K'].width = 15
    ws.column_dimensions['L'].width = 15
    ws.column_dimensions['M'].width = 12
    ws.column_dimensions['N'].width = 15
    ws.column_dimensions['O'].width = 20
    
    # Guardar en memoria
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'rutas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )


@admin_bp.route('/rutas/<int:ruta_id>', methods=['DELETE'])
def eliminar_ruta_admin(ruta_id):
    """Elimina una ruta medida con sus etapas"""
    ruta = Ruta.query.get_or_404(ruta_id)
    db.session.delete(ruta)
    db.session.commit()
    return jsonify({'mensaje': 'Ruta eliminada'})


@admin_bp.route('/limpiar-datos', methods=['POST'])
def limpiar_datos():
    """Elimina datos transaccionales de prueba sin borrar usuarios ni rutas fijas"""
    data = request.get_json(silent=True) or {}
    confirmacion = data.get('confirmacion', '')
    if confirmacion != 'BORRAR':
        return jsonify({'error': 'Confirmacion requerida'}), 400

    rutas = Ruta.query.all()
    total = len(rutas)
    for ruta in rutas:
        db.session.delete(ruta)
    db.session.commit()
    return jsonify({'mensaje': 'Datos de rutas eliminados', 'rutas_eliminadas': total})


@admin_bp.route('/importar-rutas-fijas', methods=['POST'])
def importar_rutas_fijas():
    """Importa la base de supervisores/contratistas desde Rutas fijas Mayo.xlsx"""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    archivo = os.path.join(base_dir, 'Rutas fijas Mayo.xlsx')
    if not os.path.exists(archivo):
        return jsonify({'error': 'No se encontro Rutas fijas Mayo.xlsx'}), 404

    wb = load_workbook(archivo, data_only=True)
    ws = wb['Hoja3'] if 'Hoja3' in wb.sheetnames else wb.active

    headers = {}
    for col in range(1, ws.max_column + 1):
        valor = ws.cell(row=1, column=col).value
        if valor:
            headers[str(valor).strip().upper()] = col

    requeridas = ['RUTA', 'CONTRATISTA', 'ESTATUS', 'CANAL', 'SUPERVISOR']
    faltantes = [col for col in requeridas if col not in headers]
    if faltantes:
        return jsonify({'error': f'Columnas faltantes: {", ".join(faltantes)}'}), 400

    importadas = 0
    actualizadas = 0
    for row in range(2, ws.max_row + 1):
        numero = ws.cell(row=row, column=headers['RUTA']).value
        if not numero:
            continue

        numero_ruta = str(numero).strip().upper()
        fija = RutaFija.query.filter_by(numero_ruta=numero_ruta).first()
        if not fija:
            fija = RutaFija(numero_ruta=numero_ruta)
            db.session.add(fija)
            importadas += 1
        else:
            actualizadas += 1

        fija.contratista = str(ws.cell(row=row, column=headers['CONTRATISTA']).value or '').strip()
        fija.estatus = str(ws.cell(row=row, column=headers['ESTATUS']).value or '').strip()
        fija.canal = str(ws.cell(row=row, column=headers['CANAL']).value or '').strip()
        fija.supervisor = str(ws.cell(row=row, column=headers['SUPERVISOR']).value or '').strip()
        fija.origen = os.path.basename(archivo)
        fija.fecha_importacion = datetime.utcnow()

    db.session.commit()
    return jsonify({
        'mensaje': 'Rutas fijas importadas',
        'importadas': importadas,
        'actualizadas': actualizadas,
        'total': RutaFija.query.count()
    })


@admin_bp.route('/rutas-fijas', methods=['GET'])
def obtener_rutas_fijas():
    rutas = RutaFija.query.order_by(RutaFija.supervisor, RutaFija.numero_ruta).all()
    return jsonify([{
        'id': ruta.id,
        'numero_ruta': ruta.numero_ruta,
        'contratista': ruta.contratista,
        'estatus': ruta.estatus,
        'canal': ruta.canal,
        'supervisor': ruta.supervisor,
        'origen': ruta.origen
    } for ruta in rutas])


@admin_bp.route('/opciones-filtros', methods=['GET'])
def opciones_filtros():
    supervisores = [item[0] for item in db.session.query(RutaFija.supervisor).filter(RutaFija.supervisor != '').distinct().order_by(RutaFija.supervisor).all()]
    contratistas = [item[0] for item in db.session.query(RutaFija.contratista).filter(RutaFija.contratista != '').distinct().order_by(RutaFija.contratista).all()]
    return jsonify({'supervisores': supervisores, 'contratistas': contratistas})


@admin_bp.route('/estadisticas-general', methods=['GET'])
def estadisticas_general():
    """Estadísticas generales del sistema"""
    dias = request.args.get('dias', default=30, type=int)
    
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    # Rutas
    rutas_periodo = Ruta.query.filter(Ruta.fecha >= fecha_inicio).all()
    rutas_totales = len(rutas_periodo)
    rutas_completadas = sum(1 for ruta in rutas_periodo if ruta.estado == 'completada')
    rutas_activas = sum(1 for ruta in rutas_periodo if ruta.estado == 'activa')
    rutas_canceladas = sum(1 for ruta in rutas_periodo if ruta.estado == 'cancelada')
    
    # Usuarios
    usuarios_totales = Usuario.query.filter(Usuario.activo == True).count()
    
    # Tiempo promedio por etapa
    etapas = Etapa.query.join(Ruta).filter(
        Ruta.fecha >= fecha_inicio,
        Etapa.duracion_segundos.isnot(None)
    ).all()
    
    etapas_stats = {}
    for etapa in etapas:
        nombre = etapa.nombre
        if nombre not in etapas_stats:
            etapas_stats[nombre] = []
        etapas_stats[nombre].append(etapa.duracion_segundos)
    
    etapas_promedio = {}
    for nombre, tiempos in etapas_stats.items():
        promedio = sum(tiempos) / len(tiempos)
        etapas_promedio[nombre] = {
            'promedio': int(promedio),
            'promedio_fmt': f"{int(promedio) // 60:02d}:{int(promedio) % 60:02d}",
            'minimo': min(tiempos),
            'maximo': max(tiempos),
            'cantidad': len(tiempos)
        }

    tiempos_totales = []
    for ruta in rutas_periodo:
        if ruta.estado == 'completada':
            total = sum(etapa.duracion_segundos or 0 for etapa in ruta.etapas)
            if total:
                tiempos_totales.append((ruta, total))

    promedio_total = int(sum(total for _, total in tiempos_totales) / len(tiempos_totales)) if tiempos_totales else 0
    ruta_mas_rapida = min(tiempos_totales, key=lambda item: item[1], default=None)
    ruta_mas_lenta = max(tiempos_totales, key=lambda item: item[1], default=None)
    cuello_botella = max(etapas_promedio.items(), key=lambda item: item[1]['promedio'], default=None)

    estados = {
        'activa': rutas_activas,
        'completada': rutas_completadas,
        'cancelada': rutas_canceladas
    }
    
    return jsonify({
        'rutas_totales': rutas_totales,
        'rutas_completadas': rutas_completadas,
        'rutas_activas': rutas_activas,
        'rutas_canceladas': rutas_canceladas,
        'tasa_completacion': f"{(rutas_completadas / rutas_totales * 100) if rutas_totales > 0 else 0:.1f}%",
        'usuarios_activos': usuarios_totales,
        'tiempo_promedio_total': promedio_total,
        'tiempo_promedio_total_fmt': f"{promedio_total // 3600:02d}:{(promedio_total % 3600) // 60:02d}:{promedio_total % 60:02d}",
        'ruta_mas_rapida': {
            'numero_ruta': ruta_mas_rapida[0].numero_ruta,
            'tiempo_segundos': ruta_mas_rapida[1],
            'tiempo_fmt': f"{ruta_mas_rapida[1] // 3600:02d}:{(ruta_mas_rapida[1] % 3600) // 60:02d}:{ruta_mas_rapida[1] % 60:02d}"
        } if ruta_mas_rapida else None,
        'ruta_mas_lenta': {
            'numero_ruta': ruta_mas_lenta[0].numero_ruta,
            'tiempo_segundos': ruta_mas_lenta[1],
            'tiempo_fmt': f"{ruta_mas_lenta[1] // 3600:02d}:{(ruta_mas_lenta[1] % 3600) // 60:02d}:{ruta_mas_lenta[1] % 60:02d}"
        } if ruta_mas_lenta else None,
        'cuello_botella': {
            'nombre': cuello_botella[0],
            'promedio': cuello_botella[1]['promedio'],
            'promedio_fmt': cuello_botella[1]['promedio_fmt']
        } if cuello_botella else None,
        'estados': estados,
        'etapas_promedio': etapas_promedio,
        'periodo_dias': dias
    })


@admin_bp.route('/analisis-avanzado', methods=['GET'])
def analisis_avanzado():
    """Analisis operativo para fortalecer el dashboard"""
    dias = request.args.get('dias', default=30, type=int)
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)

    rutas = Ruta.query.filter(Ruta.fecha >= fecha_inicio).order_by(Ruta.fecha.desc()).all()
    por_hora = {str(hora).zfill(2): 0 for hora in range(24)}
    ranking_etapas = {}
    supervisores = {}
    contratistas = {}
    rutas_problematicas = []

    for ruta in rutas:
        por_hora[str(ruta.fecha.hour).zfill(2)] += 1
        total = sum(etapa.duracion_segundos or 0 for etapa in ruta.etapas)
        pendientes = sum(1 for etapa in ruta.etapas if not etapa.completada)
        ruta_fija = _ruta_fija(ruta.numero_ruta)
        supervisor = ruta_fija.supervisor if ruta_fija and ruta_fija.supervisor else 'Sin supervisor'
        contratista = ruta_fija.contratista if ruta_fija and ruta_fija.contratista else 'Sin contratista'

        for bucket, nombre in ((supervisores, supervisor), (contratistas, contratista)):
            if nombre not in bucket:
                bucket[nombre] = {'rutas': 0, 'completadas': 0, 'tiempo_total': 0, 'con_tiempo': 0}
            bucket[nombre]['rutas'] += 1
            if ruta.estado == 'completada':
                bucket[nombre]['completadas'] += 1
            if total:
                bucket[nombre]['tiempo_total'] += total
                bucket[nombre]['con_tiempo'] += 1

        if ruta.estado != 'completada' or pendientes:
            rutas_problematicas.append({
                'numero_ruta': ruta.numero_ruta,
                'estado': ruta.estado,
                'pendientes': pendientes,
                'fecha': ruta.fecha.isoformat()
            })

        for etapa in ruta.etapas:
            if etapa.duracion_segundos is None:
                continue
            if etapa.nombre not in ranking_etapas:
                ranking_etapas[etapa.nombre] = {'total': 0, 'cantidad': 0, 'maximo': 0}
            ranking_etapas[etapa.nombre]['total'] += etapa.duracion_segundos
            ranking_etapas[etapa.nombre]['cantidad'] += 1
            ranking_etapas[etapa.nombre]['maximo'] = max(ranking_etapas[etapa.nombre]['maximo'], etapa.duracion_segundos)

    etapas_ordenadas = []
    for nombre, data in ranking_etapas.items():
        promedio = int(data['total'] / data['cantidad']) if data['cantidad'] else 0
        etapas_ordenadas.append({
            'nombre': nombre,
            'promedio': promedio,
            'promedio_fmt': f"{promedio // 60:02d}:{promedio % 60:02d}",
            'maximo': data['maximo'],
            'maximo_fmt': f"{data['maximo'] // 60:02d}:{data['maximo'] % 60:02d}",
            'cantidad': data['cantidad']
        })

    etapas_ordenadas.sort(key=lambda item: item['promedio'], reverse=True)

    def resumir_bucket(bucket):
        resumen = []
        for nombre, data in bucket.items():
            promedio = int(data['tiempo_total'] / data['con_tiempo']) if data['con_tiempo'] else 0
            resumen.append({
                'nombre': nombre,
                'rutas': data['rutas'],
                'completadas': data['completadas'],
                'tasa': round((data['completadas'] / data['rutas'] * 100) if data['rutas'] else 0, 1),
                'promedio': promedio,
                'promedio_fmt': _fmt_segundos(promedio)
            })
        resumen.sort(key=lambda item: (item['rutas'], item['completadas']), reverse=True)
        return resumen

    return jsonify({
        'por_hora': por_hora,
        'ranking_etapas': etapas_ordenadas,
        'supervisores': resumir_bucket(supervisores),
        'contratistas': resumir_bucket(contratistas),
        'rutas_problematicas': rutas_problematicas[:10]
    })

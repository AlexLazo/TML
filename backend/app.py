from flask import Flask, render_template, jsonify, request, redirect, session, url_for
from models import db, Usuario, Ruta, Etapa, ConfiguracionEtapa, RutaFija
from routes.api import api_bp
from routes.admin import admin_bp
from datetime import datetime
from functools import wraps
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash
import os

ROLES_ADMIN = ('admin', 'supervisor')

# Inicializar Flask
app = Flask(__name__)

# Configuración de la base de datos
base_dir = os.path.abspath(os.path.dirname(__file__))
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or f"sqlite:///{os.environ.get('DATABASE_PATH', os.path.join(base_dir, 'database.db'))}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'tu-clave-secreta-aqui')

# Inicializar extensiones
db.init_app(app)

# Registrar blueprints
app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/admin')

# Configurar rutas estáticas y templates
app.template_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'templates')
app.static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static')


def rol_requerido(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not session.get('usuario_id'):
                return redirect(url_for('login', next=request.path))
            if roles and session.get('rol') not in roles:
                session.clear()
                return redirect(url_for('login', next=request.path))
            return view(*args, **kwargs)
        return wrapped
    return decorator


def admin_requerido(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get('usuario_id'):
            return redirect(url_for('login', next=request.path))
        return view(*args, **kwargs)
    return wrapped


def verificar_password(usuario, password):
    if not usuario or not usuario.password:
        return False
    if usuario.password.startswith(('pbkdf2:', 'scrypt:')):
        return check_password_hash(usuario.password, password)
    return usuario.password == password


def obtener_rol_usuario(usuario):
    """Normaliza usuarios creados antes de existir la columna rol."""
    if usuario.es_admin:
        return 'admin'
    return usuario.rol or 'operador'


@app.route('/')
def index():
    """Página principal - interfaz móvil"""
    return render_template('mobile/index.html')


@app.route('/historial')
@rol_requerido('admin', 'supervisor')
def historial():
    """Historial de rutas"""
    return redirect(url_for('dashboard') + '#historial')


@app.route('/dashboard')
@rol_requerido('admin', 'supervisor')
def dashboard():
    """Panel de administrador"""
    return render_template('admin/dashboard.html')


@app.route('/reportes')
@rol_requerido('admin', 'supervisor')
def reportes():
    """Reportes y análisis"""
    return render_template('admin/reports.html')


@app.route('/login', methods=['GET', 'POST'])
@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    """Login de administrador"""
    next_url = request.values.get('next', '')

    if session.get('usuario_id'):
        if session.get('rol') in ROLES_ADMIN:
            return redirect(next_url or url_for('dashboard'))
        session.clear()

    error = None
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        usuario = Usuario.query.filter_by(email=email, activo=True).first()

        if usuario and verificar_password(usuario, password):
            if not usuario.password.startswith(('pbkdf2:', 'scrypt:')):
                usuario.password = generate_password_hash(password)
            rol = obtener_rol_usuario(usuario)
            if usuario.rol != rol:
                usuario.rol = rol
            db.session.commit()
            session.clear()
            session['usuario_id'] = usuario.id
            session['usuario_nombre'] = usuario.nombre
            session['rol'] = rol
            session['admin_id'] = usuario.id if session['rol'] == 'admin' else None
            session['admin_nombre'] = usuario.nombre
            destino = next_url if rol in ROLES_ADMIN and next_url else (
                url_for('dashboard') if rol in ROLES_ADMIN else url_for('index')
            )
            return redirect(destino)

        error = 'Credenciales invalidas o usuario inactivo'

    return render_template('admin/login.html', error=error, next_url=next_url)


@app.route('/logout')
@app.route('/admin/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


# Crear tablas si no existen
@app.before_request
def crear_tablas():
    """Crear tablas en la base de datos"""
    if not hasattr(app, '_tablas_creadas'):
        with app.app_context():
            db.create_all()
            asegurar_columnas_usuario()
            # Crear configuración de etapas por defecto
            if ConfiguracionEtapa.query.count() == 0:
                etapas_default = [
                    ConfiguracionEtapa(nombre='Matinal', orden=1, descripcion='Preparación matinal'),
                    ConfiguracionEtapa(nombre='Conteo de Carga', orden=2, descripcion='Conteo de paquetes'),
                    ConfiguracionEtapa(nombre='Check de Salida', orden=3, descripcion='Verificación de salida'),
                    ConfiguracionEtapa(nombre='Botón de Pánico', orden=4, descripcion='Seguridad'),
                    ConfiguracionEtapa(nombre='Tiempo en Fila', orden=5, descripcion='Tiempo en fila antes de salida'),
                ]
                for etapa in etapas_default:
                    db.session.add(etapa)
                db.session.commit()
            else:
                configuracion_previsita = ConfiguracionEtapa.query.filter_by(nombre='Impresión de Previsita').first()
                if configuracion_previsita:
                    tiempo_fila = ConfiguracionEtapa.query.filter_by(nombre='Tiempo en Fila').first()
                    if tiempo_fila:
                        db.session.delete(configuracion_previsita)
                    else:
                        configuracion_previsita.nombre = 'Tiempo en Fila'
                        configuracion_previsita.orden = 5
                        configuracion_previsita.descripcion = 'Tiempo en fila antes de salida'
                ordenes_deseadas = {
                    'Matinal': 1,
                    'Conteo de Carga': 2,
                    'Check de Salida': 3,
                    'Botón de Pánico': 4,
                    'Tiempo en Fila': 5,
                }
                for etapa in ConfiguracionEtapa.query.filter(ConfiguracionEtapa.nombre.in_(ordenes_deseadas.keys())).all():
                    etapa.orden = ordenes_deseadas.get(etapa.nombre, etapa.orden)
                db.session.commit()
            if Usuario.query.filter_by(es_admin=True).count() == 0:
                admin = Usuario(
                    nombre=os.environ.get('TML_ADMIN_NAME', 'Administrador'),
                    email=os.environ.get('TML_ADMIN_EMAIL', 'admin@tml.local').lower(),
                    password=generate_password_hash(os.environ.get('TML_ADMIN_PASSWORD', 'admin123')),
                    rol='admin',
                    es_admin=True,
                    activo=True
                )
                db.session.add(admin)
                db.session.commit()
        app._tablas_creadas = True


def asegurar_columnas_usuario():
    """Migracion ligera para instalaciones SQLite existentes sin Alembic."""
    inspector = inspect(db.engine)
    columnas = [columna['name'] for columna in inspector.get_columns('usuarios')]
    if 'rol' not in columnas:
        db.session.execute(text("ALTER TABLE usuarios ADD COLUMN rol VARCHAR(30) DEFAULT 'operador'"))

    db.session.execute(
        Usuario.__table__.update()
        .where(Usuario.es_admin.is_(True))
        .where((Usuario.rol.is_(None)) | (Usuario.rol != 'admin'))
        .values(rol='admin')
    )
    db.session.execute(
        Usuario.__table__.update()
        .where(Usuario.es_admin.is_(False))
        .where(Usuario.rol.is_(None))
        .values(rol='operador')
    )
    db.session.commit()


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

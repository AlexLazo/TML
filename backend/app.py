from flask import Flask, render_template, jsonify, request, redirect, session, url_for
from models import db, Usuario, Ruta, Etapa, ConfiguracionEtapa, RutaFija
from routes.api import api_bp
from routes.admin import admin_bp
from datetime import datetime
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
import os

# Inicializar Flask
app = Flask(__name__)

# Configuración de la base de datos
base_dir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{base_dir}/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'tu-clave-secreta-aqui'

# Inicializar extensiones
db.init_app(app)

# Registrar blueprints
app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/admin')

# Configurar rutas estáticas y templates
app.template_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'templates')
app.static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static')


def admin_requerido(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get('admin_id'):
            return redirect(url_for('login', next=request.path))
        return view(*args, **kwargs)
    return wrapped


def verificar_password(usuario, password):
    if not usuario or not usuario.password:
        return False
    if usuario.password.startswith(('pbkdf2:', 'scrypt:')):
        return check_password_hash(usuario.password, password)
    return usuario.password == password


@app.route('/')
def index():
    """Página principal - interfaz móvil"""
    return render_template('mobile/index.html')


@app.route('/historial')
@admin_requerido
def historial():
    """Historial de rutas"""
    return redirect(url_for('dashboard') + '#historial')


@app.route('/dashboard')
@admin_requerido
def dashboard():
    """Panel de administrador"""
    return render_template('admin/dashboard.html')


@app.route('/reportes')
@admin_requerido
def reportes():
    """Reportes y análisis"""
    return render_template('admin/reports.html')


@app.route('/login', methods=['GET', 'POST'])
@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    """Login de administrador"""
    if session.get('admin_id'):
        return redirect(request.args.get('next') or url_for('dashboard'))

    error = None
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        usuario = Usuario.query.filter_by(email=email, es_admin=True, activo=True).first()

        if usuario and verificar_password(usuario, password):
            if not usuario.password.startswith(('pbkdf2:', 'scrypt:')):
                usuario.password = generate_password_hash(password)
                db.session.commit()
            session.clear()
            session['admin_id'] = usuario.id
            session['admin_nombre'] = usuario.nombre
            return redirect(request.form.get('next') or url_for('dashboard'))

        error = 'Credenciales invalidas o usuario sin permisos de administrador'

    return render_template('admin/login.html', error=error, next_url=request.args.get('next', ''))


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
            # Crear configuración de etapas por defecto
            if ConfiguracionEtapa.query.count() == 0:
                etapas_default = [
                    ConfiguracionEtapa(nombre='Matinal', orden=1, descripcion='Preparación matinal'),
                    ConfiguracionEtapa(nombre='Impresión de Previsita', orden=2, descripcion='Impresión de documentos'),
                    ConfiguracionEtapa(nombre='Conteo de Carga', orden=3, descripcion='Conteo de paquetes'),
                    ConfiguracionEtapa(nombre='Check de Salida', orden=4, descripcion='Verificación de salida'),
                    ConfiguracionEtapa(nombre='Botón de Pánico', orden=5, descripcion='Seguridad'),
                ]
                for etapa in etapas_default:
                    db.session.add(etapa)
                db.session.commit()
            if Usuario.query.filter_by(es_admin=True).count() == 0:
                admin = Usuario(
                    nombre=os.environ.get('TML_ADMIN_NAME', 'Administrador'),
                    email=os.environ.get('TML_ADMIN_EMAIL', 'admin@tml.local').lower(),
                    password=generate_password_hash(os.environ.get('TML_ADMIN_PASSWORD', 'admin123')),
                    es_admin=True,
                    activo=True
                )
                db.session.add(admin)
                db.session.commit()
        app._tablas_creadas = True


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

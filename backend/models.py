from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Usuario(db.Model):
    """Modelo para usuarios de la aplicación"""
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    es_admin = db.Column(db.Boolean, default=False)
    rol = db.Column(db.String(30), default='operador')  # admin, supervisor, operador
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    rutas = db.relationship('Ruta', backref='usuario', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Usuario {self.nombre}>'


class Ruta(db.Model):
    """Modelo para las rutas de salida"""
    __tablename__ = 'rutas'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    numero_ruta = db.Column(db.String(50), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    estado = db.Column(db.String(20), default='activa')  # activa, completada, cancelada
    notas = db.Column(db.Text)
    
    # Relaciones
    etapas = db.relationship('Etapa', backref='ruta', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Ruta {self.numero_ruta}>'


class RutaFija(db.Model):
    """Base maestra de rutas fijas para analisis operativo"""
    __tablename__ = 'rutas_fijas'

    id = db.Column(db.Integer, primary_key=True)
    numero_ruta = db.Column(db.String(50), unique=True, nullable=False)
    contratista = db.Column(db.String(150))
    estatus = db.Column(db.String(50))
    canal = db.Column(db.String(50))
    supervisor = db.Column(db.String(150))
    origen = db.Column(db.String(120), default='Rutas fijas Mayo.xlsx')
    fecha_importacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<RutaFija {self.numero_ruta}>'


class Etapa(db.Model):
    """Modelo para las etapas de la ruta"""
    __tablename__ = 'etapas'
    
    id = db.Column(db.Integer, primary_key=True)
    ruta_id = db.Column(db.Integer, db.ForeignKey('rutas.id'), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)  # Matinal, Impresión, Conteo, Check, Pánico
    orden = db.Column(db.Integer, nullable=False)
    tiempo_inicio = db.Column(db.DateTime)
    tiempo_fin = db.Column(db.DateTime)
    duracion_segundos = db.Column(db.Integer)  # duracion en segundos
    completada = db.Column(db.Boolean, default=False)
    notas = db.Column(db.Text)
    
    def get_duracion_formateada(self):
        """Retorna la duración en formato HH:MM:SS"""
        if self.duracion_segundos:
            horas = self.duracion_segundos // 3600
            minutos = (self.duracion_segundos % 3600) // 60
            segundos = self.duracion_segundos % 60
            return f"{horas:02d}:{minutos:02d}:{segundos:02d}"
        return "00:00:00"
    
    def __repr__(self):
        return f'<Etapa {self.nombre}>'


class ConfiguracionEtapa(db.Model):
    """Configuración por defecto de las etapas"""
    __tablename__ = 'configuracion_etapas'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    orden = db.Column(db.Integer, nullable=False)
    activa = db.Column(db.Boolean, default=True)
    descripcion = db.Column(db.Text)
    
    def __repr__(self):
        return f'<ConfiguracionEtapa {self.nombre}>'

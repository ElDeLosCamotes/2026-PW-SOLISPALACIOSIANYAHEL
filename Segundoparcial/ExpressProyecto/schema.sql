CREATE DATABASE IF NOT EXISTS cecyt9_local;
USE cecyt9_local;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(180) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    boleta CHAR(10) NOT NULL UNIQUE,
    rol VARCHAR(30) NOT NULL DEFAULT 'alumno'
);

CREATE TABLE IF NOT EXISTS talleres (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    fecha DATE NOT NULL,
    hora TIME NULL,
    cupo INT UNSIGNED NOT NULL
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    taller_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inscripcion_taller_usuario (taller_id, usuario_id),
    UNIQUE KEY uq_inscripcion_usuario (usuario_id),
    CONSTRAINT fk_inscripciones_taller FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asistencias (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    taller_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    fecha_asistencia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asistencia_taller_usuario (taller_id, usuario_id),
    CONSTRAINT fk_asistencias_taller FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
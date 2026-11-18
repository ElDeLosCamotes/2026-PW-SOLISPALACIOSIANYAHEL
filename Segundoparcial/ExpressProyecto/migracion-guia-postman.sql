USE cecyt9_local;

ALTER TABLE talleres
    ADD COLUMN instructor VARCHAR(120) NULL AFTER nombre;

ALTER TABLE asistencias
    ADD COLUMN nombre_alumno VARCHAR(120) NULL AFTER usuario_id,
    ADD COLUMN boleta CHAR(10) NULL AFTER nombre_alumno;

UPDATE asistencias a
INNER JOIN usuarios u ON u.id = a.usuario_id
SET a.nombre_alumno = u.nombre,
    a.boleta = u.boleta
WHERE a.id > 0;

ALTER TABLE asistencias
    MODIFY COLUMN usuario_id INT UNSIGNED NULL,
    MODIFY COLUMN nombre_alumno VARCHAR(120) NOT NULL,
    MODIFY COLUMN boleta CHAR(10) NOT NULL,
    DROP INDEX uq_asistencia_taller_usuario,
    ADD UNIQUE KEY uq_asistencia_taller_boleta (taller_id, boleta);

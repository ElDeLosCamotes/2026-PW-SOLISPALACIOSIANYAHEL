// En este archivo está la lista negra: la tabla tokens_revocados.
function crearModeloTokens(pool) {
  // Anota un token como revocado (por su jti). exp viene en segundos desde 1970.
  async function revocar(jti, usuario, exp) {
    await pool.query(
      'INSERT IGNORE INTO tokens_revocados (jti, usuario, expira) VALUES (?, ?, FROM_UNIXTIME(?))',
      [jti, usuario, exp],
    );
  }

  // ¿Este jti está en la lista negra?
  // CORREGIDO: la tabla decía tokens_recovados y el arreglo de parámetros estaba FUERA de pool.query(...).
  async function estaRevocado(jti) {
    const [filas] = await pool.query('SELECT 1 FROM tokens_revocados WHERE jti = ? LIMIT 1', [String(jti || '')]);
    return filas.length > 0;
  }

  // Consulta la lista negra, del más reciente al más viejo.
  async function listar() {
    const [filas] = await pool.query(
      'SELECT jti, usuario, expira, revocado_en FROM tokens_revocados ORDER BY revocado_en DESC, jti',
    );
    return filas;
  }

  return { revocar, estaRevocado, listar };
}

module.exports = { crearModeloTokens };

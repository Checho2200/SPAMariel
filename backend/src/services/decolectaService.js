/**
 * Servicio para consumir la API de Decolecta (RENIEC / SUNAT).
 * Documentación: https://decolecta.gitbook.io/docs/servicios
 */

const DECOLECTA_BASE_URL = process.env.DECOLECTA_BASE_URL || 'https://api.decolecta.com/v1';
const DECOLECTA_TOKEN = process.env.DECOLECTA_TOKEN;

/**
 * Consulta datos personales por DNI a RENIEC
 * @param {string} dni - Número de DNI (8 dígitos)
 * @returns {{ first_name, first_last_name, second_last_name, full_name, document_number }}
 */
const consultarDNI = async (dni) => {
  if (!DECOLECTA_TOKEN) {
    throw new Error('Token de Decolecta no configurado');
  }

  if (!/^\d{8}$/.test(dni)) {
    throw new Error('El DNI debe tener exactamente 8 dígitos');
  }

  const url = `${DECOLECTA_BASE_URL}/reniec/dni?numero=${dni}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${DECOLECTA_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error al consultar DNI: ${response.status}`);
  }

  return response.json();
};

/**
 * Consulta datos de empresa por RUC a SUNAT
 * @param {string} ruc - Número de RUC (11 dígitos)
 * @returns {{ razon_social, numero_documento, estado, condicion, direccion, ... }}
 */
const consultarRUC = async (ruc) => {
  if (!DECOLECTA_TOKEN) {
    throw new Error('Token de Decolecta no configurado');
  }

  if (!/^\d{11}$/.test(ruc)) {
    throw new Error('El RUC debe tener exactamente 11 dígitos');
  }

  const url = `${DECOLECTA_BASE_URL}/sunat/ruc?numero=${ruc}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${DECOLECTA_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error al consultar RUC: ${response.status}`);
  }

  return response.json();
};

module.exports = {
  consultarDNI,
  consultarRUC,
};

/**
 * Paginación reutilizable para cualquier modelo Mongoose.
 *
 * @param {import('mongoose').Model} Model        - Modelo Mongoose
 * @param {object}  options
 * @param {object}  options.query                  - req.query (page, limit, search)
 * @param {string[]} options.searchFields          - Campos en los que buscar (ej: ['name', 'email'])
 * @param {string}  [options.select]               - Campos a excluir/incluir (ej: '-password')
 * @param {object}  [options.sort]                 - Ordenamiento (default: { createdAt: -1 })
 * @param {object}  [options.baseFilter]           - Filtro base adicional (ej: { isActive: true })
 * @returns {Promise<{ data, page, limit, total, totalPages }>}
 */
const paginate = async (Model, { query = {}, searchFields = [], select, sort = { createdAt: -1 }, baseFilter = {} } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const search = (query.search || '').trim();

  const filter = { ...baseFilter };

  if (search && searchFields.length > 0) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  const total = await Model.countDocuments(filter);

  let dbQuery = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);

  if (select) {
    dbQuery = dbQuery.select(select);
  }

  const data = await dbQuery;

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = paginate;

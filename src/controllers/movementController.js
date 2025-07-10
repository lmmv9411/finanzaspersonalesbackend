import { Op } from 'sequelize';
import { Category } from '../models/category.js';
import { Movement } from '../models/movement.js';
import { sequelize } from '../models/index.js';

export const deleteMovement = async (req, res) => {
  try {

    const { id } = req.params
    const movement = await Movement.findByPk(id)

    if (!movement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    await movement.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const createMovement = async (req, res) => {
  try {
    const { type, amount, description, CategoryId, date } = req.body
    const UserId = req.user.id

    if (!type?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Tipo ó Descripción vacíos!' })
    }

    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Monto vacío y/o menor a 0!' })
    }

    if (!CategoryId || CategoryId <= 0) {
      return res.status(400).json({ error: 'Id Categoria vacía!' })
    }

    const category = await Category.findByPk(CategoryId)
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' })

    const movement = {
      type,
      amount,
      description,
      CategoryId,
      UserId
    }

    if (date) {
      const fecha = new Date(date);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }
      movement.date = fecha;
    }

    const newMovement = await Movement.create(movement)

    res.status(201).json(newMovement)

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getBalance = async (req, res) => {

  try {

    const UserId = req.user.id;

    const { startDate, endDate } = req.query

    const totalIngreso = await Movement.sum('amount', {
      where: {
        UserId,
        type: 'ingreso',
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    })

    const totalGasto = await Movement.sum('amount', {
      where: {
        UserId,
        type: 'gasto',
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    })

    const balance = totalIngreso - totalGasto
    res.json({ balance, totalIngreso, totalGasto })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Función auxiliar para validar timezone (deberías implementarla)
function isValidTimeZone(tz) {
  return /^[+-]\d{2}:\d{2}$/.test(tz);
}

export const getByDay = async (req, res) => {
  try {
    const UserId = req.user.id;
    let { page, pageSize, type, categoryId, startDate, endDate, tz } = req.query

    if (!startDate?.trim() || !endDate?.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
    }

    if (!esFechaValida(startDate) || !esFechaValida(endDate)) {
      return res.status(400).json({ error: 'Formato de fecha inválido' })
    }

    const fStartDate = new Date(startDate);
    const fEndDate = new Date(endDate);

    if (fEndDate < fStartDate) {
      return res.status(400).json({ error: 'La fecha final debe ser posterior a la inicial' })
    }

    if (!page || !pageSize) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
    }

    pageSize = Number(pageSize)
    page = Number(page)

    const offset = (page - 1) * pageSize

    const baseWhere = {
      UserId,
      date: {
        [Op.between]: [fStartDate, fEndDate]
      }
    }

    if (type && ['ingreso', 'gasto'].includes(type)) {
      baseWhere.type = type
    }

    if (categoryId) {
      baseWhere.CategoryId = categoryId
    }

    const includeOptions = [{
      model: Category,
      attributes: ['name', 'icon'],
      ...(categoryId ? { where: { id: categoryId } } : {})
    }];

    // Configuración de zona horaria
    const timeZone = tz && isValidTimeZone(tz) ? tz : '+00:00';

    const localDateLiteral = sequelize.literal(`DATE(CONVERT_TZ(\`date\`, '+00:00', '${timeZone}'))`);

    // --- START OF REFACTORED LOGIC ---

    // Consultas para totales con filtros
    const sumQuery = (typeFilter) => ({
      where: {
        ...baseWhere,
        ...(typeFilter ? { type: typeFilter } : {})
      }
    });

    const calculateIngreso = (!type || type === 'ingreso');
    const calculateGasto = (!type || type === 'gasto');

    const [
      { count: groupedCount },
      diasAgrupados,
      totalGastoSum,
      totalIngresoSum
    ] = await Promise.all([
      // 1. Contar el total de días distintos para la paginación
      Movement.findAndCountAll({
        where: baseWhere,
        attributes: [[localDateLiteral, 'fecha']],
        group: [localDateLiteral],
        raw: true
      }),
      // 2. Obtener los días agrupados y paginados
      Movement.findAll({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('date')), 'fecha_server'],
          [localDateLiteral, 'fecha'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_dia'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_movimientos']
        ],
        where: baseWhere,
        group: [localDateLiteral],
        order: [[localDateLiteral, 'DESC']],
        limit: pageSize,
        offset: offset,
        raw: true
      }),
      // 3. Calcular totales
      calculateGasto ? Movement.sum('amount', sumQuery('gasto')) : Promise.resolve(0),
      calculateIngreso ? Movement.sum('amount', sumQuery('ingreso')) : Promise.resolve(0)
    ]);

    const totalDias = groupedCount.length;
    const totalIngreso = totalIngresoSum || 0;
    const totalGasto = totalGastoSum || 0;

    let resultado = [];

    if (diasAgrupados.length > 0) {
      const fechasDeLaPagina = diasAgrupados.map(d => d.fecha);

      // 4. Obtener los detalles solo para los días de la página actual
      const detalles = await Movement.findAll({
        attributes: {
          include: [
            [localDateLiteral, 'fecha_local_group']
          ]
        },
        where: {
          ...baseWhere,
          [Op.and]: [
            sequelize.where(localDateLiteral, { [Op.in]: fechasDeLaPagina })
          ]
        },
        include: includeOptions,
        order: [['date', 'DESC']]
      });

      // 5. Agrupar detalles por fecha para una búsqueda eficiente
      const detallesPorFecha = detalles.reduce((acc, mov) => {
        const fechaKey = mov.dataValues.fecha_local_group;
        if (!acc[fechaKey]) {
          acc[fechaKey] = [];
        }
        acc[fechaKey].push(mov);
        return acc;
      }, {});

      // 6. Combinar los resultados
      resultado = diasAgrupados.map(dia => ({
        fecha: dia.fecha,
        fecha_server: dia.fecha_server,
        total: dia.total_dia,
        cantidad_movimientos: dia.cantidad_movimientos,
        detalles: detallesPorFecha[dia.fecha] || []
      }));
    }

    const balance = totalIngreso - totalGasto;

    res.json({
      totalDias: totalDias,
      totalPages: Math.ceil(totalDias / pageSize),
      page,
      pageSize,
      totalGasto,
      totalIngreso,
      balance,
      filtersApplied: {
        type: type || 'todos',
        categoryId: categoryId || 'todas'
      },
      dias: resultado,
    });

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params
    const { type, amount, description, CategoryId, date } = req.body
    const UserId = req.user.id
    let fecha;

    if ([type, amount, description].some((field) => !field.trim())) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
    }

    if (!CategoryId) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
    }

    if (date) {
      fecha = new Date(date)
    }

    const movement = await Movement.findOne({
      where: {
        id,
        UserId
      }
    })

    if (!movement) {
      return res.status(404).json({ error: 'Movimiento no encontrado o no autorizado' })
    }

    const category = await Category.findByPk(CategoryId)
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    await movement.update({
      type,
      amount,
      description,
      CategoryId,
      date: fecha ?? movement.date
    })

    res.status(200).json(movement)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

function esFechaValida(fechaString) {
  return !isNaN(Date.parse(fechaString));
}
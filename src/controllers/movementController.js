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
    const { type, amount, description, CategoryId } = req.body
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

    const newMovement = await Movement.create({
      type,
      amount,
      description,
      CategoryId,
      UserId
    })

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

export const getByDay = async (req, res) => {
  try {
    const UserId = req.user.id;
    const { startDate, endDate } = req.query
    let { page, pageSize, type, categoryId } = req.query

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

    const [diasAgrupados, detalles] = await Promise.all([
      Movement.findAll({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('date')), 'fecha_server'],
          [sequelize.fn('DATE', sequelize.col('date')), 'fecha'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_dia'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_movimientos']
        ],
        where: baseWhere,
        group: [sequelize.fn('DATE', sequelize.col('date'))],
        order: [[sequelize.fn('DATE', sequelize.col('date')), 'DESC']],
        limit: pageSize,
        offset: offset,
        raw: true
      }),
      Movement.findAll({
        where: baseWhere,
        include: includeOptions,
        order: [['date', 'DESC']]
      })
    ])

    // Combinar los resultados
    const resultado = diasAgrupados.map(dia => ({
      fecha: dia.fecha,
      fecha_server: dia.fecha_server,
      total: dia.total_dia,
      cantidad_movimientos: dia.cantidad_movimientos,
      detalles: detalles.filter(mov =>
        mov.date.toISOString().split('T')[0] === dia.fecha
      )
    }));

    // Consulta para contar días con los mismos filtros
    const countQuery = {
      where: baseWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.fn('DATE', sequelize.col('date')))), 'total']
      ],
      raw: true
    };

    const totalDias = await Movement.findOne(countQuery);

    // Consultas para totales con filtros
    const sumQuery = (typeFilter) => ({
      where: {
        ...baseWhere,
        ...(typeFilter ? { type: typeFilter } : {})
      }
    });

    const calculateIngreso = (!type || type === 'ingreso')
    const calculateGasto = (!type || type === 'gasto')

    const [totalGasto, totalIngreso] = await Promise.all([
      calculateGasto ? Movement.sum('amount', sumQuery('gasto')) : Promise.resolve(0),
      calculateIngreso ? Movement.sum('amount', sumQuery('ingreso')) : Promise.resolve(0)
    ]).then(sums => sums.map(sum => sum || 0));

    const balance = totalIngreso - totalGasto

    res.json({
      totalDias: totalDias.total || 0,
      totalPages: Math.ceil((totalDias.total || 0) / pageSize),
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
    })

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
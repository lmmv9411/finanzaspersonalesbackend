import { Op } from 'sequelize';
import { Category } from '../models/category.js';
import { Movement } from '../models/movement.js';

export const getAllMovements = async (req, res) => {

  try {

    const UserId = req.user.id;

    const movements = await Movement.findAll({
      where: { UserId },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    })

    res.json(movements)

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

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

export const getByDate = async (req, res) => {
  try {
    const UserId = req.user.id;
    const { startDate, endDate } = req.query
    let { page, pageSize } = req.query

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

    const { count, rows } = await Movement.findAndCountAll({
      where: {
        UserId,
        date: {
          [Op.between]: [fStartDate, fEndDate]
        }
      },
      include: [Category],
      limit: pageSize,
      offset: offset,
      order: [['createdAt', 'DESC']]
    })

    res.json({
      data: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params
    const { type, amount, description, CategoryId, date } = req.body
    const UserId = req.user.id

    if ([type, amount, description, CategoryId].some((field) => !field.trim())) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
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

    if (CategoryId) {
      const category = await Category.findByPk(CategoryId)
      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' })
      }
    }

    await movement.update({
      type: type ?? movement.type,
      amount: amount ?? movement.amount,
      description: description ?? movement.description,
      CategoryId: CategoryId ?? movement.CategoryId,
      date: date ?? movement.date
    })

    res.status(200).json(movement)

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

function esFechaValida(fechaString) {
  return !isNaN(Date.parse(fechaString));
}
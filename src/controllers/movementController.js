import { Op } from 'sequelize';
import { Category } from '../models/category.js';
import { Movement } from '../models/movement.js';

export const getAllMovements = async (req, res) => {

  try {

    const UserId = req.user.id;

    const movements = await Movement.findAll({
      where: { UserId },
      include: [Category],
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

    // Verificamos si la categoría existe
    const category = await Category.findByPk(CategoryId)
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' })

    // Creamos el movimiento
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

    const movements = await Movement.findAll({
      where: {
        UserId,
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [Category],
      order: [['createdAt', 'DESC']]
    })

    res.json(movements)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params
    const { type, amount, description, CategoryId, date } = req.body
    const UserId = req.user.id

    // Buscar el movimiento y asegurarse de que pertenece al usuario
    const movement = await Movement.findOne({
      where: {
        id,
        UserId
      }
    })

    if (!movement) {
      return res.status(404).json({ error: 'Movimiento no encontrado o no autorizado' })
    }

    // Si se está actualizando la categoría, verificar que exista
    if (CategoryId) {
      const category = await Category.findByPk(CategoryId)
      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' })
      }
    }

    // Actualizar campos
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

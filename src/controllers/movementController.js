import { Movement } from '../models/movement.js'
import { Category } from '../models/category.js'

export const getAllMovements = async (req, res) => {
  try {
    const movements = await Movement.findAll({
      include: [Category] ,
      order: [['createdAt', 'DESC']]
    })
    res.json(movements)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createMovement = async (req, res) => {
  try {
    const { type, amount, description, CategoryId } = req.body

    // Verificamos si la categoría existe
    const category = await Category.findByPk(CategoryId)
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' })

    // Creamos el movimiento
    const newMovement = await Movement.create({
      type,
      amount,
      description,
      CategoryId
    })
    res.status(201).json(newMovement)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


export const getBalance = async (req, res) => {
  try {
    const totalIngreso = await Movement.sum('amount', { where: { type: 'ingreso' } })
    const totalGasto = await Movement.sum('amount', { where: { type: 'gasto' } })

    const balance = totalIngreso - totalGasto
    res.json({ balance, totalIngreso, totalGasto })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
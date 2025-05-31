import { Op } from "sequelize"
import { Category } from "../models/category.js"
import { Movement } from "../models/movement.js"
import { sequelize } from "../models/index.js"

export const getTotalByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        const UserId = req.user.id;

        if (!startDate.trim() || !endDate.trim()) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
        }

        const totalGastoByCategory = await Movement.findAll({
            attributes: [
                'CategoryId',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                UserId,
                date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                },
                type: 'gasto'
            },
            group: ['CategoryId'],
            include: {
                model: Category,
                attributes: ['name']
            }
        })

        const totalIngresoByCategory = await Movement.findAll({
            attributes: [
                'CategoryId',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                UserId,
                date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                },
                type: 'ingreso'
            },
            group: ['CategoryId'],
            include: {
                model: Category,
                attributes: ['name']
            }
        })

        res.json({ totalGastoByCategory, totalIngresoByCategory })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
import { Op } from "sequelize"
import { Category } from "../models/category.js"
import { Movement } from "../models/movement.js"
import { sequelize } from "../models/index.js"

export const getTotalByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        const UserId = req.user.id;

        const totalByCategory = await Movement.findAll({
            attributes: [
                'CategoryId',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                UserId,
                date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            group: ['CategoryId'],
            include: {
                model: Category,
                attributes: ['name']
            }
        })

        res.json(totalByCategory)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
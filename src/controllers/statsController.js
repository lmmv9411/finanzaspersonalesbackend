import { Op } from "sequelize"
import { Category } from "../models/category.js"
import { sequelize } from "../models/index.js"
import { Movement } from "../models/movement.js"

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

export const getMonthly = async (req, res) => {

    const UserId = req.user.id;

    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);

    try {
        const [ingresos, gastos] = await Promise.all([
            Movement.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'month'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                where: {
                    UserId,
                    type: 'ingreso',
                    date: { [Op.gte]: startDate }
                },
                group: ['month'],
                order: [[sequelize.literal('month'), 'ASC']],

            }),
            Movement.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'month'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                where: {
                    UserId,
                    type: 'gasto',
                    date: { [Op.gte]: startDate }
                },
                group: ['month'],
                order: [[sequelize.literal('month'), 'ASC']],

            })
        ])

        const result = {}

        ingresos.forEach(ingreso => {
            const month = ingreso.get('month')
            if (!result[month]) {
                result[month] = { ingreso: 0, gasto: 0, saldo: 0 }
            }
            result[month].ingreso = parseFloat(ingreso.get('total')) || 0
        })

        gastos.forEach(gasto => {
            const month = gasto.get('month')
            if (!result[month]) {
                result[month] = { ingreso: 0, gasto: 0, saldo: 0 }
            }
            result[month].gasto = parseFloat(gasto.get('total')) || 0
        })


        Object.keys(result).forEach(month => {
            result[month].saldo = result[month].ingreso - result[month].gasto;
        });

        return res.json(result)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message })
    }

}
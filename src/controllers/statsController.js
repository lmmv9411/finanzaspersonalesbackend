import { Op } from "sequelize"
import { Category } from "../models/category.js"
import { sequelize } from "../models/index.js"
import { Movement } from "../models/movement.js"
import { esFechaValida, isValidTimeZone } from "./movementController.js"

export const getTotalByCategory = async (req, res) => {
    try {
        const { startDate, endDate, accountId, tz } = req.query
        const UserId = req.user.id;

        if (!startDate.trim() || !endDate.trim()) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
        }

        if (!esFechaValida(startDate)) {
            return res.status(400).json({ error: 'Fecha de inicio inválida' })
        }

        if (!esFechaValida(endDate)) {
            return res.status(400).json({ error: 'Fecha de fin inválida' })
        }

        isValidTimeZone(tz) || (tz = '+00:00');

        const fStartDate = new Date(startDate);
        const fEndDate = new Date(endDate);

        if (fEndDate < fStartDate) {
            return res.status(400).json({ error: 'La fecha final debe ser posterior a la inicial' })
        }

        const utcStartLiteral = sequelize.literal(
            `CONVERT_TZ('${startDate}', '${tz}', '+00:00')`
        );

        const utcEndLiteral = sequelize.literal(
            `CONVERT_TZ('${endDate}', '${tz}', '+00:00')`
        );

        const totalGastoByCategory = await Movement.findAll({
            attributes: [
                'CategoryId',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                UserId,
                date: {
                    [Op.between]: [utcStartLiteral, utcEndLiteral]
                },
                type: 'gasto',
                ...(accountId ? { AccountId: accountId } : {})
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
                    [Op.between]: [utcStartLiteral, utcEndLiteral]
                },
                type: 'ingreso',
                ...(accountId ? { AccountId: accountId } : {})
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
    const { AccountId, tz } = req.query

    isValidTimeZone(tz) || (tz = '+00:00');

    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);

    try {
        const [ingresos, gastos] = await Promise.all([
            Movement.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.fn('CONVERT_TZ', sequelize.col('date'), '+00:00', tz), '%Y-%m'), 'month'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                where: {
                    UserId,
                    type: 'ingreso',
                    date: { [Op.gte]: startDate },
                    ...(AccountId ? { AccountId } : {})
                },
                group: ['month'],
                order: [[sequelize.literal('month'), 'ASC']],

            }),
            Movement.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.fn('CONVERT_TZ', sequelize.col('date'), '+00:00', tz), '%Y-%m'), 'month'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                where: {
                    UserId,
                    type: 'gasto',
                    date: { [Op.gte]: startDate },
                    ...(AccountId ? { AccountId } : {})
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
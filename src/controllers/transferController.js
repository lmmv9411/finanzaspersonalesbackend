import { Op } from 'sequelize'
import { Account } from '../models/account.js'
import { sequelize } from '../models/index.js'
import { Movement } from '../models/movement.js'
import { Transfer } from '../models/transfer.js'

const getAccountCurrentBalance = async (UserId, AccountId, options = {}) => {
    const queryOptions = {
        where: { UserId, AccountId },
        ...options
    }

    const [totalIngreso, totalGasto, account] = await Promise.all([
        Movement.sum('amount', { ...queryOptions, where: { ...queryOptions.where, type: 'ingreso' } }),
        Movement.sum('amount', { ...queryOptions, where: { ...queryOptions.where, type: 'gasto' } }),
        Account.findOne({ where: { id: AccountId, UserId }, ...options })
    ])

    if (!account) {
        return null
    }

    return Number(account.initialBalance) + (Number(totalIngreso) || 0) - (Number(totalGasto) || 0)
}

export const createTransfer = async (req, res) => {
    const trx = await sequelize.transaction()

    try {
        const UserId = req.user.id
        const { fromAccountId, toAccountId, amount, description, date } = req.body

        if (!fromAccountId || !toAccountId || !amount) {
            await trx.rollback()
            return res.status(400).json({ error: 'fromAccountId, toAccountId y amount son obligatorios' })
        }

        if (date && isNaN(new Date(date).getTime())) {
            await trx.rollback()
            return res.status(400).json({ error: 'Fecha inválida' })
        }

        if (Number(amount) <= 0) {
            await trx.rollback()
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' })
        }

        if (Number(fromAccountId) === Number(toAccountId)) {
            await trx.rollback()
            return res.status(400).json({ error: 'La cuenta origen y destino deben ser diferentes' })
        }

        const [fromAccount, toAccount] = await Promise.all([
            Account.findOne({ where: { id: fromAccountId, UserId }, transaction: trx }),
            Account.findOne({ where: { id: toAccountId, UserId }, transaction: trx })
        ])

        if (!fromAccount || !toAccount) {
            await trx.rollback()
            return res.status(404).json({ error: 'Cuenta origen o destino no encontrada' })
        }

        const currentBalance = await getAccountCurrentBalance(UserId, fromAccountId, { transaction: trx })
        if (currentBalance < Number(amount)) {
            await trx.rollback()
            return res.status(409).json({ error: 'Saldo insuficiente en la cuenta origen' })
        }

        let transferDate;

        if (date) {
            transferDate = new Date(date)
            if (isNaN(transferDate.getTime())) {
                await trx.rollback()
                return res.status(400).json({ error: 'Fecha inválida' })
            }
        }

        const transfer = await Transfer.create({
            UserId,
            fromAccountId,
            toAccountId,
            amount,
            description: description?.trim() || `Transferencia entre cuentas`,
            ...(transferDate ? { date: transferDate } : {})
        }, { transaction: trx })

        await Movement.create({
            UserId,
            AccountId: fromAccountId,
            TransferId: transfer.id,
            isTransfer: true,
            transferRole: 'origen',
            type: 'gasto',
            amount,
            description: description?.trim() || `Transferencia a ${toAccount.name}`,
            ...(transferDate ? { date: transferDate } : {})
        }, { transaction: trx })

        await Movement.create({
            UserId,
            AccountId: toAccountId,
            TransferId: transfer.id,
            isTransfer: true,
            transferRole: 'destino',
            type: 'ingreso',
            amount,
            description: description?.trim() || `Transferencia desde ${fromAccount.name}`,
            ...(transferDate ? { date: transferDate } : {})
        }, { transaction: trx })

        await trx.commit()

        const createdTransfer = await Transfer.findByPk(transfer.id, {
            include: [
                { model: Account, as: 'fromAccount', attributes: ['id', 'name', 'type'] },
                { model: Account, as: 'toAccount', attributes: ['id', 'name', 'type'] }
            ]
        })

        return res.status(201).json(createdTransfer)
    } catch (error) {
        await trx.rollback()
        return res.status(500).json({ error: error.message })
    }
}

export const getTransfers = async (req, res) => {
    try {
        const UserId = req.user.id
        const { startDate, endDate, accountId } = req.query

        const where = { UserId }

        if (startDate && endDate) {
            where.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            }
        }

        if (accountId) {
            where[Op.or] = [
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ]
        }

        const transfers = await Transfer.findAll({
            where,
            include: [
                { model: Account, as: 'fromAccount', attributes: ['id', 'name', 'type'] },
                { model: Account, as: 'toAccount', attributes: ['id', 'name', 'type'] }
            ],
            order: [['date', 'DESC']]
        })

        return res.json(transfers)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

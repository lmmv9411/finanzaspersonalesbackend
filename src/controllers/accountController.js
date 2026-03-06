import { Account } from "../models/account.js"
import { Movement } from "../models/movement.js"

export const getAllAccounts = async (req, res) => {
    try {

        const userId = req.user.id
        const accounts = await Account.findAll({
            where: { UserId: userId },
            order: [['createdAt', 'DESC']]
        })

        const accountsWithBalance = await Promise.all(accounts.map(async (account) => {

            const totalIngreso = await Movement.sum('amount', {
                where: { UserId: userId, AccountId: account.id, type: 'ingreso' }
            })

            const totalGasto = await Movement.sum('amount', {
                where: { UserId: userId, AccountId: account.id, type: 'gasto' }
            })

            const currentBalance = Number(account.initialBalance || 0) + (totalIngreso || 0) - (totalGasto || 0)

            return {
                ...account.toJSON(),
                currentBalance,
                totalGasto,
                totalIngreso
            }
        }))

        res.json(accountsWithBalance)

    } catch (error) {
        console.error('Error al obtener las cuentas:', error)
        res.status(500).json({ message: 'Error al obtener las cuentas' })
    }
}

const getAccountCurrentBalance = async (userId, accountId) => {

    const [account, totalIngreso, totalGasto] = await Promise.all([

        Account.findOne({ where: { id: accountId, UserId: userId } }),

        Movement.sum('amount', {
            where: { UserId: userId, AccountId: accountId, type: 'ingreso' }
        }),

        Movement.sum('amount', {
            where: { UserId: userId, AccountId: accountId, type: 'gasto' }
        })
    ])

    if (!account) {
        return null
    }

    return {
        ...account.toJSON(),
        totalGasto: Number(totalGasto) || 0,
        totalIngreso: Number(totalIngreso) || 0,
        currentBalance: Number(account.initialBalance || 0) + (Number(totalIngreso) || 0) - (Number(totalGasto) || 0)
    }
}

export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const balanceData = await getAccountCurrentBalance(userId, id)

        if (!balanceData) {
            return res.status(404).json({ message: 'Cuenta no encontrada' })
        }

        res.json(balanceData)

    } catch (error) {
        console.error('Error al obtener la cuenta:', error)
        res.status(500).json({ message: 'Error al obtener la cuenta' })
    }
}

export const createAccount = async (req, res) => {
    try {
        const userId = req.user.id
        const { name, type, initialBalance, description } = req.body
        const newAccount = await Account.create({
            name,
            type,
            initialBalance,
            description,
            UserId: userId
        })
        res.status(201).json(newAccount)
    } catch (error) {
        console.error('Error al crear la cuenta:', error)
        res.status(500).json({ message: 'Error al crear la cuenta' })
    }
}

export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id
        const { name, type, initialBalance, description } = req.body
        const account = await Account.findOne({
            where: { id, UserId: userId }
        })
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada' })
        }
        account.name = name || account.name
        account.type = type || account.type
        account.initialBalance = initialBalance !== undefined ? initialBalance : account.initialBalance
        account.description = description || account.description
        await account.save()
        res.json(account)
    } catch (error) {
        console.error('Error al actualizar la cuenta:', error)
        res.status(500).json({ message: 'Error al actualizar la cuenta' })
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id
        const account = await Account.findOne({
            where: { id, UserId: userId }
        })
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada' })
        }
        await account.destroy()
        res.json({ message: 'Cuenta eliminada' })
    } catch (error) {
        console.error('Error al eliminar la cuenta:', error)
        res.status(500).json({ message: 'Error al eliminar la cuenta' })
    }
}

export const reconcileAccountBalance = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id
        const { realBalance, description, date } = req.body

        if (realBalance === undefined || realBalance === null || Number.isNaN(Number(realBalance))) {
            return res.status(400).json({ message: 'realBalance es obligatorio y debe ser numérico' })
        }

        if (date && Number.isNaN(new Date(date).getTime())) {
            return res.status(400).json({ message: 'Fecha inválida' })
        }

        const balanceData = await getAccountCurrentBalance(userId, id)
        if (!balanceData) {
            return res.status(404).json({ message: 'Cuenta no encontrada' })
        }

        const targetBalance = Number(realBalance)
        const delta = Number((targetBalance - balanceData.currentBalance).toFixed(2))

        if (delta === 0) {
            return res
                .status(400)
                .json({
                    message: 'No hay diferencia para ajustar',
                    adjustmentCreated: false,
                    currentBalance: balanceData.currentBalance
                })
        }

        const adjustmentMovement = await Movement.create({
            type: delta > 0 ? 'ingreso' : 'gasto',
            amount: Math.abs(delta),
            description: `[AJUSTE] ${description?.trim() || 'Ajuste manual de saldo.'}`,
            AccountId: balanceData.id,
            UserId: userId,
            ...(date ? { date: new Date(date) } : {})
        })

        return res.status(201).json({
            message: 'Ajuste aplicado correctamente',
            adjustmentCreated: true,
            previousBalance: balanceData.currentBalance,
            currentBalance: targetBalance,
            differenceApplied: delta,
            movement: adjustmentMovement
        })
    } catch (error) {
        console.error('Error al reconciliar saldo de la cuenta:', error)
        return res.status(500).json({ message: 'Error al reconciliar saldo de la cuenta' })
    }
}
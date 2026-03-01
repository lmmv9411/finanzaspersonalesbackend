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

/*export const getAllAccounts = async (req, res) => {
    try {
        const userId = req.user.id
        const accounts = await Account.findAll({
            where: { UserId: userId },
            order: [['createdAt', 'DESC']]
        })
        res.json(accounts)
    } catch (error) {
        console.error('Error al obtener las cuentas:', error)
        res.status(500).json({ message: 'Error al obtener las cuentas' })
    }
}*/

export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id
        const account = await Account.findOne({
            where: { id, UserId: userId }
        })
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada' })
        }
        res.json(account)
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
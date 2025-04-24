import { Expense } from '../models/expense.js'

export const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll()
        res.json(expenses)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const createExpense = async (req, res) => {
    try {
        const { description, amount } = req.body
        const newExpense = await Expense.create({ description, amount })
        res.status(201).json(newExpense)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params
        const { description, amount } = req.body
        const expense = await Expense.findByPk(id)
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' })
        }
        expense.description = description
        expense.amount = amount
        await expense.save()
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params
        const expense = await Expense.findByPk(id)
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' })
        }
        await expense.destroy()
        res.status(204).send()
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params
        const expense = await Expense.findByPk(id)
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' })
        }
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
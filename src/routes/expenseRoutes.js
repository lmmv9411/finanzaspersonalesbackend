import express from 'express'
import { createExpense, deleteExpense, getAllExpenses, getExpenseById, updateExpense } from '../controllers/expenseController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.get('/', getAllExpenses)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)
router.get('/:id', getExpenseById)

export default router

import express from 'express'
import { auth } from '../middlewares/auth.js'
import {
  createAccount,
  deleteAccount,
  getAccountById,
  getAllAccounts,
  reconcileAccountBalance,
  updateAccount
} from '../controllers/accountController.js'

const router = express.Router()

router.use(auth)

router.get('/', getAllAccounts)
router.get('/:id', getAccountById)
router.post('/', createAccount)
router.put('/:id', updateAccount)
router.delete('/:id', deleteAccount)
router.post('/:id/reconcile', reconcileAccountBalance)

export default router

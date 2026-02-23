import express from 'express'
import { auth } from '../middlewares/auth.js'
import {
  createAccount,
  deleteAccount,
  getAccountById,
  getAllAccounts,
  updateAccount
} from '../controllers/accountController.js'

const router = express.Router()

router.use(auth)

router.get('/', getAllAccounts)
router.get('/:id', getAccountById)
router.post('/', createAccount)
router.put('/:id', updateAccount)
router.delete('/:id', deleteAccount)

export default router

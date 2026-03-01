import express from 'express'
import { auth } from '../middlewares/auth.js'
import { createTransfer, deleteTransfer, getTransferById, getTransfers } from '../controllers/transferController.js'

const router = express.Router()

router.use(auth)

router.post('/', createTransfer)
router.get('/', getTransfers)
router.get('/:id', getTransferById)
router.delete('/:id', deleteTransfer)

export default router

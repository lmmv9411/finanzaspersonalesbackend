import express from 'express'
import { auth } from '../middlewares/auth.js'
import { createTransfer, getTransfers } from '../controllers/transferController.js'

const router = express.Router()

router.use(auth)

router.post('/', createTransfer)
router.get('/', getTransfers)

export default router

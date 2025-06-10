import {
    createMovement,
    deleteMovement,
    getBalance,
    getByDay,
    updateMovement
} from '../controllers/movementController.js'
import express from 'express'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.post('/', createMovement)
router.get('/balance', getBalance)
router.delete('/:id', deleteMovement)
router.put('/:id', updateMovement)
router.get('/day', getByDay)

export default router

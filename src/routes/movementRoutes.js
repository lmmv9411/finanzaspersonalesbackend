import {
    createMovement,
    deleteMovement,
    getAllMovements,
    getBalance,
    getByDate,
    getByDay,
    updateMovement
} from '../controllers/movementController.js'
import express from 'express'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.get('/', getAllMovements)
router.post('/', createMovement)
router.get('/balance', getBalance)
router.get('/date', getByDate)
router.delete('/:id', deleteMovement)
router.put('/:id', updateMovement)
router.get('/day', getByDay)

export default router

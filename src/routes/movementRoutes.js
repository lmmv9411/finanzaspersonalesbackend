import express from 'express'
import { getAllMovements, createMovement, getBalance, getByDate, deleteMovement } from '../controllers/movementController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.get('/', getAllMovements)  // Obtener todos los movimientos
router.post('/', createMovement)  // Crear un nuevo movimiento
router.get('/balance', getBalance)  // Obtener el balance total
router.get('/date', getByDate)  // Obtener movimientos por fecha
router.delete('/:id', deleteMovement)

export default router

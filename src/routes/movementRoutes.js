import express from 'express'
import { getAllMovements, createMovement, getBalance, getByDate } from '../controllers/movementController.js'

const router = express.Router()

router.get('/', getAllMovements)  // Obtener todos los movimientos
router.post('/', createMovement)  // Crear un nuevo movimiento
router.get('/balance', getBalance)  // Obtener el balance total
router.get('/date', getByDate)  // Obtener movimientos por fecha

export default router

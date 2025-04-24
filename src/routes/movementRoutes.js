import express from 'express'
import { getAllMovements, createMovement, getBalance } from '../controllers/movementController.js'

const router = express.Router()

router.get('/', getAllMovements)  // Obtener todos los movimientos
router.post('/', createMovement)  // Crear un nuevo movimiento
router.get('/balance', getBalance)  // Obtener el balance total

export default router

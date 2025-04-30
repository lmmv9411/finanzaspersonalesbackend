import express from 'express'

import { getTotalByCategory } from '../controllers/statsController.js'

const router = express.Router()

router.get('/totalByCategory', getTotalByCategory)  // Obtener total por categoría

export default router
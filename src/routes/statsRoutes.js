import express from 'express'

import { getTotalByCategory, getMonthly } from '../controllers/statsController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.get('/totalByCategory', getTotalByCategory)
router.get('/monthly', getMonthly)

export default router
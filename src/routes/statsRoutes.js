import express from 'express'

import { getTotalByCategory } from '../controllers/statsController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.use(auth)

router.get('/totalByCategory', getTotalByCategory)

export default router
import express from 'express'

import { getUser, login, logout, register } from '../controllers/userController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.post('/login', login)

router.use(auth)

router.get('/', getUser)
router.post('/register', register)
router.post('/logout', logout)

export default router
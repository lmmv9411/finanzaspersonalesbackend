import express from 'express'

import { login, getByUser, register, logout } from '../controllers/userController.js'

const router = express.Router()

router.get('/', getByUser)
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

export default router
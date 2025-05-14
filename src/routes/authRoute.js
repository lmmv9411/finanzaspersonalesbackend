import express from 'express'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.get('/check', auth, (req, res) => {
    res.json({ ok: true, user: req.user })
})

export default router

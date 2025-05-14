import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { sequelize, testConnection } from './models/index.js'
import categoryRoutes from './routes/categoryRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import userRouter from './routes/userRoutes.js'
import cookieParser from 'cookie-parser'
import authRoute from './routes/authRoute.js'

dotenv.config()

if (process.env.DB_NAME) {
    console.log(process.env.DB_NAME);
}


if (process.env.SECRET_KEY) {
    console.log(process.env.SECRET_KEY);
}


const app = express()

app.use(cors({
    origin: 'http://localhost:5173', // el origen exacto del frontend
    credentials: true, // permite enviar cookies
}))
app.use(express.json())
app.use(cookieParser())

const _dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.static(path.join(_dirname, 'public')))

app.use('/api/expenses', expenseRoutes)
app.use('/api/movements', movementRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/user', userRouter)
app.use('/api/auth', authRoute)

app.get(/\/(.*)/, (req, res) => {
    res.sendFile(path.join(_dirname, 'public', 'index.html'))
});

const startServer = async () => {
    await testConnection()
    await sequelize.sync()  // crea tablas si no existen
    app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'))
}

startServer()

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { sequelize, testConnection } from './models/index.js'
import categoryRoutes from './routes/categoryRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import userRouter from './routes/userRoutes.js'
import cookieParser from 'cookie-parser'
import authRoute from './routes/authRoute.js'

dotenv.config()

const app = express()

/*const allowedOrigins = [
    'http://localhost:5173',
    'http://192.168.1.66:5173',
    'http://localhost:3000',
    'http://192.168.1.66:3000'
];*/

app.use(cors(/*{
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (por ejemplo, curl o Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true, // permite enviar cookies
}*/))

app.use(express.json())
app.use(cookieParser())

const _dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.static(path.join(_dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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
    //await sequelize.sync({ alter: true });
    await sequelize.sync()  // crea tablas si no existen
    app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'))
}

startServer()

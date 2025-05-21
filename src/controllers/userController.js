import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const register = async (req, res) => {
    const { user, name, lastName, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await User.create({ user, name, lastName, password: hash });
        res.json({ message: 'Usuario registrado' });
    } catch (err) {
        res.status(400).json({ error: 'Error al registrar' });
    }
}

export const login = async (req, res) => {

    try {
        const { user, password } = req.body;

        if (!user || !password) return res.status(400).json({ error: 'Campos vacíos' })

        const userDB = await User.findOne({ where: { user } });
        if (!userDB) return res.status(400).json({ error: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(password, userDB.password);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            {
                user: userDB.user,
                name: userDB.name,
                lastName: userDB.lastName,
                id: userDB.id
            },
            process.env.SECRET_KEY, {
            expiresIn: '30d',
        });

        /*res.cookie('sesion', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })*/

        res.json({ token })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('sesion', {
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
        })
        res.json({ message: 'Sesion cerrada' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const getUser = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
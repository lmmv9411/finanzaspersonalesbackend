import bcrypt from "bcryptjs";
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.js";

export const register = async (req, res) => {
    const { user, name, lastName, password } = req.body;

    if ([user, name, lastName, password].some((field) => !field?.trim())) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios!' })
    }

    const hash = await bcrypt.hash(password, 10);

    try {
        await User.create({ user, name, lastName, password: hash });
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err });
    }
}

export const login = async (req, res) => {

    try {
        const { user, password } = req.body;

        if (!user?.trim() || !password?.trim()) {
            return res.status(400).json({ error: 'Campos vacíos' })
        }

        const userDB = await User.findOne({ where: { user } });
        if (!userDB) return res.status(400).json({ error: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(password, userDB.password);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            {
                user: userDB.user,
                name: userDB.name,
                lastName: userDB.lastName,
                id: userDB.id,
                profilePicture: userDB.profilePicture
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

        const userDB = await User.findOne({ where: { user: req.user.user } })

        if (!userDB) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userData = userDB.get({ plain: true });
        delete userData.password;

        res.json({ ...userData });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

export const upload = multer({ storage });

export const uploadProfilePicture = async (req, res) => {
    try {
        const user = req.user;
        const filename = req.file.filename;
        const url = `/uploads/${filename}`;

        const userDB = await User.findByPk(user.id);
        if (!userDB) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (userDB.profilePicture) {
            try {
                const oldFileName = path.basename(userDB.profilePicture)
                const oldPath = path.join(__dirname, '../public/uploads', oldFileName)
                await fs.unlink(oldPath)
            } catch (error) {
                console.error('Error al eliminar la imagen anterior:', error);
            }
        }

        userDB.profilePicture = url;
        await userDB.save();

        res.status(201).json({ url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err });
    }
}

export const password = async (req, res) => {
    try {

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(404).json({ error: 'Todos los campos son obligatorios!' });
        }

        const userDB = await User.findOne({ where: { user: req.user.user } })

        if (!userDB) {
            return res.status(404).json({ error: 'Usuario no encontrado!' });
        }

        const valid = await bcrypt.compare(oldPassword, userDB.password);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const check = await checkPassword(newPassword)

        if (!check.status) {
            return res.status(404).json({ error: check.message })
        }

        const hash = await bcrypt.hash(newPassword, 10);

        await userDB.update({
            password: hash
        })

        res.status(201).json({ status: 'ok' })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error })
    }

}

const checkPassword = async (newPassword) => {
    const response = { status: false, message: '' }

    if (newPassword.length < 8) {
        response.message = 'Minimo 8 caracteres'
        return response
    }

    if (!/\d/.test(newPassword)) {
        response.message = 'Minimo 1 Número'
        return response
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        response.message = 'Minimo un caracter especial'
        return response
    }


    response.status = true
    return response

}
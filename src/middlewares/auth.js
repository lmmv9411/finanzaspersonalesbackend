import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.SECRET_KEY

export const auth = (req, res, next) => {

    const sesion = req.cookies?.sesion;

    if (!sesion) {
        return res.status(401).json({ message: 'sesion no encontrada' });
    }

    try {
        const decoded = jwt.verify(sesion, SECRET_KEY);
        req.user = decoded; // Guardas el usuario en la request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'sesion inválido' });
    }

}
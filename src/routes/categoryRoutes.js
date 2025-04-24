import express from 'express';
import { getAllCategories, createCategory, getCategoryById, deleteCategory, updateCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);  // Obtener todas las categorías
router.post('/', createCategory);  // Crear una nueva categoría
router.get('/:id', getCategoryById);  // Obtener una categoría por ID
router.put('/:id', updateCategory);  // Actualizar una categoría por ID
router.delete('/:id', deleteCategory);  // Eliminar una categoría por ID

export default router;
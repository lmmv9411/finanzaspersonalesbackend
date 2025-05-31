import { Category } from "../models/category.js";

export const getAllCategories = async (req, res) => {
    try {
        const UserId = req.user.id;
        const categories = await Category.findAll({ where: { UserId } });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name.trim()) {
            return res.status(400).json({ error: 'Nombre vacío!' })
        }

        const UserId = req.user.id;
        const newCategory = await Category.create({ name, UserId });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name.trim()) {
            return res.status(400).json({ error: 'Nombre vacío!' })
        }

        const category = await Category.findByPk(id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        category.name = name;
        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        await category.destroy();
        res.status(204).send();
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({
                error: 'No se puede eliminar categoria por que otras entidades depende de esta.'
            });
        }
        res.status(500).json({ error: error.message });
    }
}

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   
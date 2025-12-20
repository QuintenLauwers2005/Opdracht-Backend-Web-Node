const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET alle categorieën
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json({ data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET één categorie
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categorie niet gevonden' });
        }

        res.json({ data: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET producten binnen een categorie
router.get('/:id/products', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM products WHERE category_id = ?',
            [req.params.id]
        );

        res.json({ data: rows, count: rows.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST nieuwe categorie
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validatie
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Naam is verplicht' });
        }

        // Check voor cijfers in naam
        if (/\d/.test(name)) {
            return res.status(400).json({ error: 'Categorie naam mag geen cijfers bevatten' });
        }

        const [result] = await db.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        res.status(201).json({
            message: 'Categorie succesvol aangemaakt',
            data: { id: result.insertId, name }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update categorie
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validatie
        if (name !== undefined && name.trim() === '') {
            return res.status(400).json({ error: 'Naam mag niet leeg zijn' });
        }

        if (name && /\d/.test(name)) {
            return res.status(400).json({ error: 'Categorie naam mag geen cijfers bevatten' });
        }

        // Check of categorie bestaat
        const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Categorie niet gevonden' });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }

        if (updates.length > 0) {
            values.push(req.params.id);
            await db.run(
                `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        res.json({ message: 'Categorie succesvol geüpdatet' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE categorie
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.run(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categorie niet gevonden' });
        }

        res.json({ message: 'Categorie succesvol verwijderd' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
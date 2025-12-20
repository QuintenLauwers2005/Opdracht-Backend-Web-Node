const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET alle producten (met limit en offset)
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const [rows] = await db.query(
            'SELECT * FROM products LIMIT ? OFFSET ?',
            [limit, offset]
        );

        // Tel totaal aantal producten
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM products');
        const total = countResult[0].total;

        res.json({
            data: rows,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET zoeken op naam
router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';

        if (!searchTerm) {
            return res.status(400).json({ error: 'Zoekterm is verplicht' });
        }

        const [rows] = await db.query(
            'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?',
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        res.json({ data: rows, count: rows.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET één product
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product niet gevonden' });
        }

        res.json({ data: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST nieuw product
router.post('/', async (req, res) => {
    try {
        const { name, description, price, stock, category_id } = req.body;

        // Validatie
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Naam is verplicht' });
        }

        if (!price || isNaN(price) || price < 0) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn' });
        }

        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return res.status(400).json({ error: 'Voorraad moet een positief getal zijn' });
        }

        const [result] = await db.run(
            'INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
            [name, description || null, price, stock || 0, category_id || null]
        );

        res.status(201).json({
            message: 'Product succesvol aangemaakt',
            data: { id: result.insertId, name, price, stock }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, stock, category_id } = req.body;

        // Validatie
        if (name !== undefined && name.trim() === '') {
            return res.status(400).json({ error: 'Naam mag niet leeg zijn' });
        }

        if (price !== undefined && (isNaN(price) || price < 0)) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn' });
        }

        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return res.status(400).json({ error: 'Voorraad moet een positief getal zijn' });
        }

        // Check of product bestaat
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Product niet gevonden' });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (price !== undefined) { updates.push('price = ?'); values.push(price); }
        if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
        if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }

        if (updates.length > 0) {
            values.push(req.params.id);
            await db.run(
                `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        res.json({ message: 'Product succesvol geüpdatet' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.run(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product niet gevonden' });
        }

        res.json({ message: 'Product succesvol verwijderd' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/database');

const validateName = (name) => {
    if (!name || name.trim() === '') {
        return { valid: false, message: 'Naam is verplicht' };
    }
    if (name.length < 2) {
        return { valid: false, message: 'Naam moet minstens 2 karakters bevatten' };
    }
    if (name.length > 100) {
        return { valid: false, message: 'Naam mag maximaal 100 karakters bevatten' };
    }
    if (/\d/.test(name)) {
        return { valid: false, message: 'Categorie naam mag geen cijfers bevatten' };
    }
    if (!/^[a-zA-Z\s\u00C0-\u017F]+$/.test(name)) {
        return { valid: false, message: 'Naam mag alleen letters en spaties bevatten' };
    }
    return { valid: true };
};

router.get('/', async (req, res) => {
    try {
        const sortBy = req.query.sort || 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const searchName = req.query.name || '';

        const allowedSortFields = ['id', 'name', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

        let query = 'SELECT * FROM categories WHERE 1=1';
        const params = [];

        if (searchName) {
            query += ' AND name LIKE ?';
            params.push(`%${searchName}%`);
        }

        query += ` ORDER BY ${sortField} ${order}`;

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                sorting: {
                    sortBy: sortField,
                    order
                },
                filters: {
                    searchName: searchName || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.get('/with-counts', async (req, res) => {
    try {
        const query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `;

        const [rows] = await db.query(query);

        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                description: 'Categorieën met aantal producten per categorie'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        const [countResult] = await db.query(
            'SELECT COUNT(*) as product_count FROM products WHERE category_id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...rows[0],
                product_count: countResult[0].product_count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.get('/:id/products', async (req, res) => {
    try {
        const sortBy = req.query.sort || 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const inStock = req.query.in_stock;
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

        const allowedSortFields = ['id', 'name', 'price', 'stock'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

        const [categoryExists] = await db.query('SELECT id, name FROM categories WHERE id = ?', [req.params.id]);
        if (categoryExists.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        let query = 'SELECT * FROM products WHERE category_id = ?';
        const params = [req.params.id];

        if (inStock === 'true') {
            query += ' AND stock > 0';
        } else if (inStock === 'false') {
            query += ' AND stock = 0';
        }

        if (minPrice !== null) {
            query += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== null) {
            query += ' AND price <= ?';
            params.push(maxPrice);
        }

        query += ` ORDER BY ${sortField} ${order}`;

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            data: rows,
            meta: {
                category: categoryExists[0],
                count: rows.length,
                sorting: {
                    sortBy: sortField,
                    order
                },
                filters: {
                    inStock: inStock || null,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'name',
                message: nameValidation.message
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
            [name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'name',
                message: 'Een categorie met deze naam bestaat al'
            });
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'description',
                message: 'Beschrijving mag maximaal 500 karakters bevatten'
            });
        }

        const [result] = await db.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name.trim(), description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Categorie succesvol aangemaakt',
            data: {
                id: result.insertId,
                name: name.trim(),
                description: description || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;

        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        if (name !== undefined) {
            const nameValidation = validateName(name);
            if (!nameValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'name',
                    message: nameValidation.message
                });
            }

            const [duplicate] = await db.query(
                'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
                [name.trim(), req.params.id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'name',
                    message: 'Een andere categorie met deze naam bestaat al'
                });
            }
        }

        if (description !== undefined && description !== null && description.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'description',
                message: 'Beschrijving mag maximaal 500 karakters bevatten'
            });
        }

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geen velden om te updaten',
                message: 'Geef minstens één veld op om te wijzigen'
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await db.run(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Categorie succesvol geüpdatet',
            data: updated[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        const [productCount] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [req.params.id]
        );

        const hasProducts = productCount[0].count > 0;

        const [result] = await db.run(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Categorie succesvol verwijderd',
            data: {
                id: req.params.id,
                deletedCategory: existing[0],
                affectedProducts: hasProducts ? productCount[0].count : 0,
                note: hasProducts ? 'Producten in deze categorie zijn nu zonder categorie' : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/database');

const validatePrice = (price) => {
    if (price === undefined || price === null) return { valid: false, message: 'Prijs is verplicht' };
    if (isNaN(price)) return { valid: false, message: 'Prijs moet een nummer zijn' };
    if (price < 0) return { valid: false, message: 'Prijs moet positief zijn' };
    if (price > 1000000) return { valid: false, message: 'Prijs mag niet hoger zijn dan €1.000.000' };
    return { valid: true };
};

const validateStock = (stock) => {
    if (stock === undefined || stock === null) return { valid: true };
    if (isNaN(stock)) return { valid: false, message: 'Voorraad moet een nummer zijn' };
    if (stock < 0) return { valid: false, message: 'Voorraad kan niet negatief zijn' };
    if (!Number.isInteger(Number(stock))) return { valid: false, message: 'Voorraad moet een geheel getal zijn' };
    return { valid: true };
};

const validateName = (name) => {
    if (!name || name.trim() === '') return { valid: false, message: 'Naam is verplicht' };
    if (name.length < 3) return { valid: false, message: 'Naam moet minstens 3 karakters bevatten' };
    if (name.length > 200) return { valid: false, message: 'Naam mag maximaal 200 karakters bevatten' };
    return { valid: true };
};

router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sort || 'id';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';

        const searchName = req.query.name || '';
        const searchDescription = req.query.description || '';

        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;
        const inStock = req.query.in_stock;
        const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;

        const allowedSortFields = ['id', 'name', 'price', 'stock', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (searchName) {
            query += ' AND name LIKE ?';
            params.push(`%${searchName}%`);
        }

        if (searchDescription) {
            query += ' AND description LIKE ?';
            params.push(`%${searchDescription}%`);
        }

        if (minPrice !== null) {
            query += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== null) {
            query += ' AND price <= ?';
            params.push(maxPrice);
        }

        if (inStock === 'true') {
            query += ' AND stock > 0';
        } else if (inStock === 'false') {
            query += ' AND stock = 0';
        }

        if (categoryId) {
            query += ' AND category_id = ?';
            params.push(categoryId);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0].total;

        query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            data: rows,
            meta: {
                pagination: {
                    limit,
                    offset,
                    total,
                    count: rows.length,
                    hasMore: offset + limit < total,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit)
                },
                filters: {
                    searchName: searchName || null,
                    searchDescription: searchDescription || null,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    inStock: inStock || null,
                    categoryId: categoryId || null
                },
                sorting: {
                    sortBy: sortField,
                    order
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

router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

        if (!searchTerm && minPrice === null && maxPrice === null) {
            return res.status(400).json({
                success: false,
                error: 'Minstens één zoekcriterium is verplicht (q, min_price, of max_price)'
            });
        }

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (searchTerm) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (minPrice !== null) {
            query += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== null) {
            query += ' AND price <= ?';
            params.push(maxPrice);
        }

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                searchCriteria: {
                    term: searchTerm || null,
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

router.get('/in-stock', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE stock > 0 ORDER BY stock DESC');

        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                filter: 'in_stock'
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

router.get('/out-of-stock', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE stock = 0 ORDER BY name');

        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                filter: 'out_of_stock'
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
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
            });
        }

        res.json({
            success: true,
            data: rows[0]
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
        const { name, description, price, stock, category_id } = req.body;

        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'name',
                message: nameValidation.message
            });
        }

        const priceValidation = validatePrice(price);
        if (!priceValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'price',
                message: priceValidation.message
            });
        }

        const stockValidation = validateStock(stock);
        if (!stockValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'stock',
                message: stockValidation.message
            });
        }

        if (category_id) {
            const [categoryExists] = await db.query('SELECT id FROM categories WHERE id = ?', [category_id]);
            if (categoryExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'category_id',
                    message: 'Categorie bestaat niet'
                });
            }
        }

        const [result] = await db.run(
            'INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), description || null, price, stock || 0, category_id || null]
        );

        res.status(201).json({
            success: true,
            message: 'Product succesvol aangemaakt',
            data: {
                id: result.insertId,
                name: name.trim(),
                price,
                stock: stock || 0,
                category_id: category_id || null
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
        const { name, description, price, stock, category_id } = req.body;

        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
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
        }

        if (price !== undefined) {
            const priceValidation = validatePrice(price);
            if (!priceValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'price',
                    message: priceValidation.message
                });
            }
        }

        if (stock !== undefined) {
            const stockValidation = validateStock(stock);
            if (!stockValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'stock',
                    message: stockValidation.message
                });
            }
        }

        if (category_id !== undefined && category_id !== null) {
            const [categoryExists] = await db.query('SELECT id FROM categories WHERE id = ?', [category_id]);
            if (categoryExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Validatie error',
                    field: 'category_id',
                    message: 'Categorie bestaat niet'
                });
            }
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
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }
        if (stock !== undefined) {
            updates.push('stock = ?');
            values.push(stock);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(category_id);
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
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Product succesvol geüpdatet',
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
        const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
            });
        }

        const [result] = await db.run(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Product succesvol verwijderd',
            data: {
                id: req.params.id,
                deletedProduct: existing[0]
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
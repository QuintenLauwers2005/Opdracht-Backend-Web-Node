const express = require('express');
const router = express.Router();
const db = require('../config/database');

// VALIDATIE FUNCTIE VOOR CATEGORIE NAAM
// Categorienamen hebben strengere regels dan productnamen:
// - Geen cijfers toegestaan (want "Ring2" is geen goede categorienaam)
// - Alleen letters en spaties (inclusief speciale letters zoals é, ñ, ü)
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
    // /\d/ is een regex die checkt of er cijfers in zitten
    if (/\d/.test(name)) {
        return { valid: false, message: 'Categorie naam mag geen cijfers bevatten' };
    }
    // Deze regex checkt of ALLE karakters letters of spaties zijn
    // \u00C0-\u017F = Unicode range voor speciale letters (é, ñ, ü etc.)
    if (!/^[a-zA-Z\s\u00C0-\u017F]+$/.test(name)) {
        return { valid: false, message: 'Naam mag alleen letters en spaties bevatten' };
    }
    return { valid: true };
};

// ALLE CATEGORIEËN OPHALEN
// Ondersteunt sorteren en zoeken op naam
// Eenvoudiger dan products omdat categorieën minder filters nodig hebben
router.get('/', async (req, res) => {
    try {
        // Parameters uitlezen met defaults
        const sortBy = req.query.sort || 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const searchName = req.query.name || '';

        // WHITELIST VOOR SORTEER VELDEN
        // Voorkomt dat iemand probeert te sorteren op een niet-bestaand veld
        const allowedSortFields = ['id', 'name', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

        // QUERY BUILDER MET OPTIONEEL ZOEKFILTER
        // WHERE 1=1 is een trucje zodat we gemakkelijk AND kunnen toevoegen
        let query = 'SELECT * FROM categories WHERE 1=1';
        const params = [];

        // Als er gezocht wordt op naam, voeg LIKE conditie toe
        if (searchName) {
            query += ' AND name LIKE ?';
            params.push(`%${searchName}%`);
        }

        // Voeg ORDER BY clause toe
        query += ` ORDER BY ${sortField} ${order}`;

        // Voer de query uit
        const [rows] = await db.query(query, params);

        // Stuur response met metadata over de query
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

// CATEGORIEËN MET PRODUCT AANTALLEN
// Dit is een GEAVANCEERDE query met een JOIN en GROUP BY
// Het combineert data uit twee tabellen (categories en products)
router.get('/with-counts', async (req, res) => {
    try {
        // COMPLEXE SQL QUERY UITLEG
        // SELECT c.* = alle kolommen van categories tabel
        // COUNT(p.id) = tel hoeveel producten er zijn per categorie
        // LEFT JOIN = neem alle categorieën, ook als ze geen producten hebben
        //   (bij INNER JOIN zouden categorieën zonder producten worden weggelaten)
        // GROUP BY c.id = groepeer per categorie (nodig voor COUNT)
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

        // Elk row object heeft nu een extra veld: product_count
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

// SPECIFIEKE CATEGORIE OPHALEN
// Haalt één categorie op met het aantal producten erin
router.get('/:id', async (req, res) => {
    try {
        // Haal de categorie op
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        // Check of de categorie bestaat
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        // Tel hoeveel producten er in deze categorie zitten
        // Dit is een aparte query omdat het efficient is voor één categorie
        const [countResult] = await db.query(
            'SELECT COUNT(*) as product_count FROM products WHERE category_id = ?',
            [req.params.id]
        );

        // Combineer de data: spread operator (...) haalt alle velden uit rows[0]
        // en we voegen product_count toe
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

// PRODUCTEN BINNEN EEN CATEGORIE
// Dit endpoint combineert categorie en product data
// Bijvoorbeeld: GET /api/categories/1/products geeft alle producten in categorie 1
router.get('/:id/products', async (req, res) => {
    try {
        // Parameters voor sorteren en filteren
        const sortBy = req.query.sort || 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const inStock = req.query.in_stock;
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

        // Whitelist voor sorteren velden
        const allowedSortFields = ['id', 'name', 'price', 'stock'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

        // VALIDATIE: BESTAAT DE CATEGORIE?
        // Voordat we producten zoeken, checken we of de categorie bestaat
        // Anders zou iemand producten kunnen opvragen van categorie 999999
        const [categoryExists] = await db.query('SELECT id, name FROM categories WHERE id = ?', [req.params.id]);
        if (categoryExists.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        // QUERY BUILDER VOOR PRODUCTEN IN DEZE CATEGORIE
        let query = 'SELECT * FROM products WHERE category_id = ?';
        const params = [req.params.id];  // Start met het categorie ID

        // Voorraad filter
        if (inStock === 'true') {
            query += ' AND stock > 0';
        } else if (inStock === 'false') {
            query += ' AND stock = 0';
        }

        // Prijs filters
        if (minPrice !== null) {
            query += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== null) {
            query += ' AND price <= ?';
            params.push(maxPrice);
        }

        // Sortering toevoegen
        query += ` ORDER BY ${sortField} ${order}`;

        const [rows] = await db.query(query, params);

        // Response met categorie informatie in de metadata
        // Zo weet de client in welke categorie deze producten zitten
        res.json({
            success: true,
            data: rows,
            meta: {
                category: categoryExists[0],  // Naam en ID van de categorie
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

// NIEUWE CATEGORIE TOEVOEGEN
// POST request met naam en optioneel beschrijving
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        // NAAM VALIDATIE
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'name',
                message: nameValidation.message
            });
        }

        // UNIEKHEID CHECK
        // Categorienamen moeten uniek zijn
        // LOWER() functie maakt het case-insensitive: "Ringen" = "ringen" = "RINGEN"
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

        // BESCHRIJVING VALIDATIE
        // Beschrijving is optioneel, maar als het er is, max 500 karakters
        if (description && description.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'description',
                message: 'Beschrijving mag maximaal 500 karakters bevatten'
            });
        }

        // INSERT IN DATABASE
        // .trim() verwijdert spaties aan begin en einde
        // || null geeft NULL in plaats van undefined/empty string
        const [result] = await db.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name.trim(), description || null]
        );

        // Status 201 = Created
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

// CATEGORIE UPDATEN
// PUT request naar /api/categories/:id
// Partiële update: alleen meegegeven velden worden ge-update
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;

        // CHECK OF CATEGORIE BESTAAT
        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        // NAAM VALIDATIE EN UNIEKHEID CHECK
        // Alleen als naam is meegegeven (undefined check)
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

            // Check of een ANDERE categorie deze naam al heeft
            // id != ? zorgt dat we de huidige categorie niet meenemen
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

        // BESCHRIJVING VALIDATIE
        if (description !== undefined && description !== null && description.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'description',
                message: 'Beschrijving mag maximaal 500 karakters bevatten'
            });
        }

        // DYNAMISCHE UPDATE QUERY
        // Alleen updaten wat is meegegeven
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

        // Als er niets is meegegeven, geef een error
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geen velden om te updaten',
                message: 'Geef minstens één veld op om te wijzigen'
            });
        }

        // Voeg altijd updated_at timestamp toe
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        // Voer de UPDATE uit
        await db.run(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Haal de ge-update categorie op
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

// CATEGORIE VERWIJDEREN
// DELETE request naar /api/categories/:id
// Dit verwijdert de categorie, maar NIET de producten erin!
router.delete('/:id', async (req, res) => {
    try {
        // Haal de categorie op voordat we verwijderen
        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Categorie niet gevonden',
                message: `Geen categorie gevonden met ID ${req.params.id}`
            });
        }

        // CHECK HOEVEEL PRODUCTEN GERAAKT WORDEN
        // Tel hoeveel producten in deze categorie zitten
        // Dit is belangrijke informatie voor de gebruiker
        const [productCount] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [req.params.id]
        );

        const hasProducts = productCount[0].count > 0;

        // VERWIJDER DE CATEGORIE
        // Door de database setup (ON DELETE SET NULL) worden producten
        // in deze categorie NIET verwijderd, maar hun category_id wordt NULL
        await db.run(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        // INFORMATIEVE RESPONSE
        // We vertellen de gebruiker hoeveel producten zijn beïnvloed
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

// EXPORT DE ROUTER
module.exports = router;
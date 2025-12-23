const express = require('express');
const router = express.Router();
const db = require('../config/database');

// VALIDATIE FUNCTIES
// Deze functies controleren of de input data correct is VOORDAT we naar de database gaan
// Dit voorkomt dat er ongeldige data in de database komt (data integriteit)
// Elke functie returned een object met {valid: boolean, message: string}

// Controleert of de prijs geldig is
// Moet een nummer zijn, positief, en niet hoger dan 1 miljoen euro
const validatePrice = (price) => {
    if (price === undefined || price === null) return { valid: false, message: 'Prijs is verplicht' };
    if (isNaN(price)) return { valid: false, message: 'Prijs moet een nummer zijn' };
    if (price < 0) return { valid: false, message: 'Prijs moet positief zijn' };
    if (price > 1000000) return { valid: false, message: 'Prijs mag niet hoger zijn dan €1.000.000' };
    return { valid: true };
};

// Controleert of de voorraad geldig is
// Moet een positief geheel getal zijn (je kunt geen 2.5 ringen hebben)
const validateStock = (stock) => {
    if (stock === undefined || stock === null) return { valid: true }; // Stock is optioneel
    if (isNaN(stock)) return { valid: false, message: 'Voorraad moet een nummer zijn' };
    if (stock < 0) return { valid: false, message: 'Voorraad kan niet negatief zijn' };
    if (!Number.isInteger(Number(stock))) return { valid: false, message: 'Voorraad moet een geheel getal zijn' };
    return { valid: true };
};

// Controleert of de naam geldig is
// Tussen 3 en 200 karakters, en niet leeg
const validateName = (name) => {
    if (!name || name.trim() === '') return { valid: false, message: 'Naam is verplicht' };
    if (name.length < 3) return { valid: false, message: 'Naam moet minstens 3 karakters bevatten' };
    if (name.length > 200) return { valid: false, message: 'Naam mag maximaal 200 karakters bevatten' };
    return { valid: true };
};

// GET ALLE PRODUCTEN (GEAVANCEERD)
// Dit is het meest complexe endpoint - het ondersteunt:
// - Paginatie (limit/offset)
// - Sorteren (op verschillende velden, ASC/DESC)
// - Filtering (prijs range, voorraad, categorie)
// - Zoeken (in naam en beschrijving)
router.get('/', async (req, res) => {
    try {
        // PARAMETERS UITLEZEN EN DEFAULTS INSTELLEN
        // parseInt() zet een string om naar een nummer
        // || operator geeft de waarde rechts als links falsy is (undefined, null, 0, '')
        const limit = parseInt(req.query.limit) || 10;  // Hoeveel resultaten per pagina
        const offset = parseInt(req.query.offset) || 0; // Vanaf welk resultaat beginnen
        const sortBy = req.query.sort || 'id';          // Op welk veld sorteren
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC'; // Oplopend of aflopend

        // Zoekfilters uit de query parameters halen
        const searchName = req.query.name || '';
        const searchDescription = req.query.description || '';
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;
        const inStock = req.query.in_stock;
        const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;

        // BEVEILIGING: WHITELIST VAN SORTEER VELDEN
        // We controleren of het sorteer veld geldig is om SQL injection te voorkomen
        // Als iemand probeert te sorteren op een veld dat niet bestaat, gebruiken we 'id'
        const allowedSortFields = ['id', 'name', 'price', 'stock', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

        // DYNAMISCHE QUERY BUILDER
        // We bouwen de SQL query stap voor stap op, afhankelijk van de filters
        // WHERE 1=1 is een trucje om gemakkelijk AND condities toe te voegen
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = []; // Array om SQL parameters veilig op te slaan (voorkomt SQL injection)

        // Als er een naam zoekterm is, voeg een LIKE conditie toe
        // LIKE met % aan beide kanten zoekt naar gedeeltelijke matches
        // Voorbeeld: "ring" vindt "verlovingsring" en "ringen"
        if (searchName) {
            query += ' AND name LIKE ?';
            params.push(`%${searchName}%`);
        }

        // Hetzelfde voor beschrijving
        if (searchDescription) {
            query += ' AND description LIKE ?';
            params.push(`%${searchDescription}%`);
        }

        // Prijs range filters
        // >= betekent "groter dan of gelijk aan"
        if (minPrice !== null) {
            query += ' AND price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== null) {
            query += ' AND price <= ?';
            params.push(maxPrice);
        }

        // Voorraad filter - we vergelijken met string 'true'/'false'
        // omdat query parameters altijd strings zijn
        if (inStock === 'true') {
            query += ' AND stock > 0';  // Op voorraad
        } else if (inStock === 'false') {
            query += ' AND stock = 0';  // Uitverkocht
        }

        // Filter op categorie ID
        if (categoryId) {
            query += ' AND category_id = ?';
            params.push(categoryId);
        }

        // TOTAAL AANTAL PRODUCTEN TELLEN
        // We maken een kopie van de query maar vervangen SELECT * met COUNT(*)
        // Dit geeft ons het totaal aantal resultaten (zonder limit/offset)
        // Nodig voor paginatie metadata
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0].total;

        // SORTERING EN PAGINATIE TOEVOEGEN
        // LIMIT = hoeveel resultaten
        // OFFSET = hoeveel resultaten overslaan
        // Voorbeeld: LIMIT 10 OFFSET 20 = geef resultaten 21-30
        query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // QUERY UITVOEREN
        const [rows] = await db.query(query, params);

        // RESPONSE MET UITGEBREIDE METADATA
        // We sturen niet alleen de data terug, maar ook nuttige informatie over:
        // - Hoeveel resultaten er zijn
        // - Welke filters zijn toegepast
        // - Hoe er gesorteerd is
        // - Of er nog meer pagina's zijn
        res.json({
            success: true,
            data: rows,
            meta: {
                pagination: {
                    limit,
                    offset,
                    total,
                    count: rows.length,  // Aantal resultaten in deze response
                    hasMore: offset + limit < total,  // Zijn er nog meer pagina's?
                    page: Math.floor(offset / limit) + 1,  // Huidige pagina nummer
                    totalPages: Math.ceil(total / limit)   // Totaal aantal pagina's
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
        // Als er iets fout gaat, stuur een error response
        // Status 500 = Internal Server Error
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// GEAVANCEERD ZOEKEN
// Zoek op meerdere velden tegelijk met één zoekterm
// Voorbeeld: ?q=goud vindt producten met "goud" in naam OF beschrijving
router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

        // Validatie: minstens één zoekcriterium is verplicht
        if (!searchTerm && minPrice === null && maxPrice === null) {
            return res.status(400).json({
                success: false,
                error: 'Minstens één zoekcriterium is verplicht (q, min_price, of max_price)'
            });
        }

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        // Zoek in BEIDE velden (naam EN beschrijving) met OR
        // Haakjes zijn belangrijk voor de juiste logica
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

// PRODUCTEN OP VOORRAAD
// Simpel endpoint dat alleen producten toont met stock > 0
// Gesorteerd op voorraad (hoogste eerst)
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

// UITVERKOCHTE PRODUCTEN
// Toont alleen producten waar stock = 0
// Handig voor admin om te zien wat moet worden bijbesteld
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

// SPECIFIEK PRODUCT OPHALEN
// :id in de URL is een route parameter
// Bijvoorbeeld: GET /api/products/5 haalt product met ID 5 op
router.get('/:id', async (req, res) => {
    try {
        // req.params.id bevat de waarde uit de URL
        const [rows] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        // Als er geen resultaten zijn, bestaat het product niet
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
            });
        }

        // rows[0] omdat we maar één product verwachten
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

// NIEUW PRODUCT TOEVOEGEN
// POST request met JSON body
// Alle validatie gebeurt VOORDAT we naar de database gaan
router.post('/', async (req, res) => {
    try {
        // Destructuring: haal deze velden uit req.body
        const { name, description, price, stock, category_id } = req.body;

        // VALIDATIE STAPPEN
        // Elke validatie functie geeft een object terug
        // Als valid: false is, stoppen we en geven een foutmelding

        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validatie error',
                field: 'name',  // Welk veld is fout
                message: nameValidation.message  // Wat is er fout
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

        // Als er een category_id is opgegeven, controleer of die categorie bestaat
        // Dit voorkomt dat we een product linken aan een niet-bestaande categorie
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

        // INSERT IN DATABASE
        // ? tekens zijn placeholders voor de parameters array
        // Dit voorkomt SQL injection - NOOIT zelf strings concatenaten in SQL!
        // .trim() verwijdert spaties aan het begin en einde
        // || operator geeft default waarde als links falsy is
        const [result] = await db.run(
            'INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), description || null, price, stock || 0, category_id || null]
        );

        // Status 201 = Created (iets nieuws is aangemaakt)
        // result.insertId is het auto-increment ID van het nieuwe product
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

// PRODUCT UPDATEN
// PUT request naar /api/products/:id
// Alle velden zijn optioneel - update alleen wat je meegeeft (partial update)
router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, stock, category_id } = req.body;

        // CONTROLEER OF PRODUCT BESTAAT
        // Voordat we gaan updaten, checken we of het product überhaupt bestaat
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
            });
        }

        // VALIDATIE VAN OPGEGEVEN VELDEN
        // We valideren alleen de velden die zijn meegegeven
        // !== undefined checkt of het veld aanwezig is in de request body
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

        // DYNAMISCHE UPDATE QUERY BUILDER
        // We bouwen de UPDATE query dynamisch op
        // Alleen velden die zijn meegegeven worden ge-update
        const updates = [];  // Array van "veld = ?" strings
        const values = [];   // Array van waarden

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

        // Als er helemaal niets is meegegeven om te updaten
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Geen velden om te updaten',
                message: 'Geef minstens één veld op om te wijzigen'
            });
        }

        // Voeg altijd updated_at timestamp toe
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);  // ID voor de WHERE clause

        // Join de array met komma's: ['name = ?', 'price = ?'] wordt "name = ?, price = ?"
        await db.run(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Haal het ge-update product op om terug te sturen
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

// PRODUCT VERWIJDEREN
// DELETE request naar /api/products/:id
// Let op: dit verwijdert permanent uit de database!
router.delete('/:id', async (req, res) => {
    try {
        // Haal eerst het product op voordat we het verwijderen
        // Zo kunnen we de data terugsturen in de response
        const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product niet gevonden',
                message: `Geen product gevonden met ID ${req.params.id}`
            });
        }

        // Voer de DELETE uit
        await db.run(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        // Stuur de data van het verwijderde product terug
        // Dit is handig voor logging of om de actie ongedaan te maken
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

// EXPORT DE ROUTER
// De router object bevat alle bovenstaande routes
// Dit wordt geïmporteerd in het hoofd app bestand
module.exports = router;
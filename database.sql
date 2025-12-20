-- Tabel voor categorieën
CREATE TABLE IF NOT EXISTS categories (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          name TEXT NOT NULL,
                                          description TEXT,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel voor producten
CREATE TABLE IF NOT EXISTS products (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        name TEXT NOT NULL,
                                        description TEXT,
                                        price REAL NOT NULL,
                                        stock INTEGER DEFAULT 0,
                                        category_id INTEGER,
                                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

-- Voorbeelddata voor categorieën
INSERT INTO categories (name, description) VALUES
                                               ('Ringen', 'Collectie van gouden en zilveren ringen'),
                                               ('Kettingen', 'Elegante halskettingen voor elke gelegenheid'),
                                               ('Oorbellen', 'Prachtige oorbellen in diverse stijlen'),
                                               ('Armbanden', 'Stijlvolle arm- en polsbanden'),
                                               ('Horloges', 'Luxe horloges van topmerken');

-- Voorbeelddata voor producten
INSERT INTO products (name, description, price, stock, category_id) VALUES
                                                                        ('Gouden verlovingsring', '18k gouden ring met 0.5ct diamant', 2499.99, 3, 1),
                                                                        ('Zilveren ring', '925 sterling zilveren ring met zirkonia', 89.99, 15, 1),
                                                                        ('Gouden ketting', '14k gouden ketting 50cm', 599.99, 8, 2),
                                                                        ('Zilveren ketting met hanger', '925 sterling zilver met hartvormige hanger', 129.99, 12, 2),
                                                                        ('Diamanten oorbellen', '14k witgoud met 0.25ct diamant per stuk', 1899.99, 5, 3),
                                                                        ('Parel oorbellen', 'Echte zoetwaterparels met zilver', 179.99, 20, 3),
                                                                        ('Gouden armband', '18k gouden schakelarmband', 1299.99, 4, 4),
                                                                        ('Leren armband', 'Leren armband met zilveren sluiting', 49.99, 30, 4),
                                                                        ('Rolex Submariner replica', 'Hoogwaardige replica van klassiek model', 299.99, 10, 5),
                                                                        ('Cartier Tank horloge', 'Elegant dameshorloge met leren band', 3499.99, 2, 5),
                                                                        ('Trouwring set goud', 'Set van 2 gouden trouwringen 18k', 1899.99, 6, 1),
                                                                        ('Tennisarmband', 'Zilveren armband met zirkonia steentjes', 249.99, 8, 4),
                                                                        ('Choker ketting', 'Trendy choker ketting in zilver', 79.99, 15, 2),
                                                                        ('Creolen groot', 'Grote gouden creolen 3cm diameter', 399.99, 10, 3),
                                                                        ('Manchetknopen', 'Zilveren manchetknopen met onyx', 159.99, 12, 4);
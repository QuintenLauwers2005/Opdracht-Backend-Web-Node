# 💎 Juwelier API

Een RESTful API voor het beheren van producten en categorieën voor een juwelier webshop.

## 📋 Vereisten

- Node.js (versie 20 of hoger)
- MySQL (versie 5.7 of hoger)
- npm (komt automatisch met Node.js)

## 🚀 Installatie

### 1. Clone de repository
```bash
git clone <jouw-github-url>
cd <project-map>
```

### 2. Installeer dependencies
```bash
npm install
```

### 3. Database opzetten

**Optie A: Via phpMyAdmin of MySQL Workbench**
- Open het bestand `database.sql`
- Voer de SQL queries uit in je database tool

**Optie B: Via command line**
```bash
mysql -u root -p < database.sql
```

### 4. Configureer environment variabelen

Kopieer het `.env` bestand en pas de database credentials aan:
```env
PORT=3000
DB_HOST=localhost
DB_USER=jouw_gebruikersnaam
DB_PASSWORD=jouw_wachtwoord
DB_NAME=juwelier_db
```

### 5. Start de server

**Development mode (met automatisch herstarten):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

De API draait nu op: `http://localhost:3000`

## 📚 API Documentatie

Bezoek `http://localhost:3000` voor de volledige API documentatie.

### Belangrijkste Endpoints

#### Products
- `GET /api/products` - Alle producten (met limit/offset/sort/filter)
- `GET /api/products/search?q=ring&min_price=100&max_price=500` - Geavanceerd zoeken
- `GET /api/products/in-stock` - Alleen voorraad producten
- `GET /api/products/out-of-stock` - Uitverkochte producten
- `GET /api/products/:id` - Specifiek product
- `POST /api/products` - Nieuw product toevoegen
- `PUT /api/products/:id` - Product updaten
- `DELETE /api/products/:id` - Product verwijderen

#### Query Parameters voor /api/products
- `limit` - Aantal resultaten (default: 10)
- `offset` - Startpositie (default: 0)
- `sort` - Sorteer op: id, name, price, stock, created_at
- `order` - Volgorde: asc of desc
- `name` - Filter op productnaam
- `description` - Filter op beschrijving
- `min_price` - Minimum prijs
- `max_price` - Maximum prijs
- `in_stock` - Filter op voorraad (true/false)
- `category_id` - Filter op categorie

#### Categories
- `GET /api/categories` - Alle categorieën (met sort/filter)
- `GET /api/categories/with-counts` - Categorieën met product aantallen
- `GET /api/categories/:id` - Specifieke categorie (met product count)
- `GET /api/categories/:id/products` - Producten in categorie (met filters)
- `POST /api/categories` - Nieuwe categorie
- `PUT /api/categories/:id` - Categorie updaten
- `DELETE /api/categories/:id` - Categorie verwijderen

## ✅ Functionele Requirements (checklist)

### Minimum Requirements
- [x] Twee CRUD interfaces (Products & Categories)
- [x] Basisvalidatie (lege velden, numerieke controles)
- [x] Limit en offset endpoint (`GET /api/products?limit=10&offset=0`)
- [x] Zoeken op veld (`GET /api/products/search?q=ring`)
- [x] API documentatie pagina op root URL

### Extra Features Geïmplementeerd
- [x] **Geavanceerde validatie**
    - Minimale/maximale lengtes voor velden
    - Custom error messages per validatiefout
    - Prijs range validatie (max €1.000.000)
    - Geheel getal validatie voor voorraad
    - Unieke naam check voor categorieën
    - Foreign key validatie (category_id moet bestaan)
    - Alleen letters in categorie namen

- [x] **Zoeken op meerdere velden**
    - Zoek op naam EN beschrijving tegelijk
    - Combineer zoeken met prijs filtering
    - Filter op voorraad status
    - Filter op categorie

- [x] **Sorteren van resultaten**
    - Sort by: id, name, price, stock, created_at
    - Ascending of descending order
    - Werkt op alle lijst endpoints

- [x] **Uitgebreid filteren**
    - Min/max prijs ranges
    - In stock / out of stock filtering
    - Filter per categorie
    - Combineerbare filters

- [x] **Betere response structuur**
    - Consistente `success` vlag in alle responses
    - Uitgebreide `meta` data (pagination info, filters, sorting)
    - Specifieke error messages met field indicator
    - Complete pagination info (page, totalPages, hasMore)

- [x] **Extra endpoints**
    - `/api/products/in-stock` - Alleen voorraad producten
    - `/api/products/out-of-stock` - Uitverkochte producten
    - `/api/categories/with-counts` - Categorieën met product count
    - Categorie-specifieke product listings met filters

## 🧪 API Testen

### Met cURL (command line)
```bash
# Alle producten ophalen (gesorteerd op prijs)
curl "http://localhost:3000/api/products?sort=price&order=desc"

# Zoek ringen tussen €100 en €500
curl "http://localhost:3000/api/products?name=ring&min_price=100&max_price=500"

# Producten op voorraad in categorie 1
curl "http://localhost:3000/api/categories/1/products?in_stock=true"

# Product toevoegen met validatie
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test product","price":99.99,"stock":10,"category_id":1}'

# Product updaten (partial update)
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":149.99}'
```

### Met PhpStorm HTTP Client
1. Tools → HTTP Client → Create Request
2. Maak een `.http` bestand aan met:
```http
### Alle producten gesorteerd op prijs
GET http://localhost:3000/api/products?sort=price&order=desc

### Geavanceerd zoeken
GET http://localhost:3000/api/products/search?q=goud&min_price=500&max_price=2000

### Producten op voorraad
GET http://localhost:3000/api/products/in-stock

### Categorieën met product count
GET http://localhost:3000/api/categories/with-counts

### Product toevoegen
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "Nieuwe ring",
  "description": "Prachtige gouden ring",
  "price": 199.99,
  "stock": 5,
  "category_id": 1
}

### Product updaten (partial)
PUT http://localhost:3000/api/products/1
Content-Type: application/json

{
  "stock": 15,
  "price": 179.99
}

### Producten filteren
GET http://localhost:3000/api/products?min_price=100&max_price=500&in_stock=true&sort=price
```

### Met Postman of Insomnia
Importeer de endpoints vanuit de documentatie pagina.

## 📁 Project Structuur

```
project/
├── node_modules/          # Dependencies (niet in git)
├── src/
│   ├── config/
│   │   └── database.js    # Database connectie
│   └── routes/
│       ├── products.js    # Product routes
│       └── categories.js  # Categorie routes
├── public/
│   └── index.html         # API documentatie
├── .env                   # Environment variabelen (niet in git)
├── .gitignore
├── database.sql           # Database setup
├── package.json
├── server.js              # Hoofdbestand
└── README.md
```

## 🔧 Technologieën

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL2** - Database driver
- **dotenv** - Environment variabelen
- **cors** - Cross-Origin Resource Sharing
- **nodemon** - Auto-restart tijdens development

## 📝 Bronvermeldingen

- Express documentatie: https://expressjs.com/
- MySQL2 package: https://www.npmjs.com/package/mysql2
- Node.js best practices: https://github.com/goldbergyoni/nodebestpractices

## 🎯 Toekomstige Uitbreidingen

Ideeën om verder uit te werken:
- [ ] JWT authenticatie
- [ ] Image upload voor producten
- [ ] Filtering op prijs, voorraad, etc.
- [ ] Reviews/ratings systeem
- [ ] Wishlist functionaliteit
- [ ] Order management

## 👤 Auteur

[Quinten Lauwers]

## 📄 Licentie

Dit project is gemaakt voor educatieve doeleinden.
# 💎 Juwelier API

Een RESTful API voor het beheren van producten en categorieën voor een juwelier webshop.

## 🗄️ Database Keuze

Dit project gebruikt **SQLite** als database om de volgende redenen:
- **Eenvoudige setup:** Geen aparte database server nodig (XAMPP/MySQL)
- **Portable:** Database is een enkel bestand (`juwelier.db`) dat gemakkelijk te delen is via Git
- **Voldoet aan requirements:** Volledig database-driven met alle CRUD operaties
- **Ideaal voor development:** Snel te installeren en te testen
- **Cross-platform:** Werkt op Windows, Mac en Linux zonder extra configuratie
- **Geen conflicten:** Geen poort-conflicten of XAMPP problemen

SQLite is perfect geschikt voor dit project omdat het alle vereiste functionaliteiten ondersteunt (CRUD, filtering, sorting, validatie) zonder de complexiteit van een aparte database server.

### Andere overwogen opties
- **MySQL:** Zou ook kunnen, maar vereist XAMPP/MAMP installatie en configuratie
- **PostgreSQL:** Krachtig maar overkill voor dit project
- **MongoDB:** NoSQL alternatief, maar SQL past beter bij de relationele data structuur

Voor een productie-omgeving met veel gelijktijdige gebruikers zou MySQL/PostgreSQL een betere keuze zijn, maar voor dit educatieve project biedt SQLite de beste balans tussen functionaliteit en eenvoud.

## 📋 Vereisten

- **Node.js** (versie 20 of hoger) - [Download hier](https://nodejs.org/)
- **Git** - [Download hier](https://git-scm.com/)
- **Geen** MySQL/XAMPP nodig - SQLite wordt automatisch geïnstalleerd via npm!

## 🚀 Installatie

### Stap 1: Clone de repository
```bash
git clone https://github.com/QuintenLauwers2005/Opdracht-Backend-Web-Node.git
cd Opdracht-Backend-Web-Node
```

### Stap 2: Installeer dependencies
```bash
npm install
```

Dit installeert automatisch alle benodigde packages:
- express (web framework)
- sqlite3 (database driver)
- dotenv (environment variabelen)
- cors (cross-origin resource sharing)
- nodemon (development - auto-restart)

### Stap 3: Database opzetten

**Kies één van deze drie opties:**

#### Optie A: Via Node.js script (AANBEVOLEN - makkelijkst!)

```bash
node setup-db.js
```

Je zou moeten zien:
```
🔧 Database setup gestart...
✅ Database succesvol aangemaakt: juwelier.db
✅ Tabellen aangemaakt: products, categories
✅ Voorbeelddata toegevoegd: 15 producten, 5 categorieën
📊 Verificatie: 15 producten in database
📊 Verificatie: 5 categorieën in database
🎉 Setup compleet! Je kunt nu "npm run dev" uitvoeren.
```

#### Optie B: Via PhpStorm Database Tool

1. Open PhpStorm
2. View → Tool Windows → Database (of rechter sidebar)
3. Klik **"+"** → Data Source → SQLite
4. Bij **File**: selecteer `juwelier.db` in je project root
5. Download driver indien gevraagd
6. Test Connection → OK
7. Rechtsklik op `juwelier.db` → New → Query Console
8. Kopieer de inhoud van `database.sql`
9. Plak en voer uit (Ctrl+Enter of groene play button)

#### Optie C: Via command line (SQLite CLI)

```bash
# Installeer sqlite3 CLI tool (indien nodig)
# Windows: download van https://www.sqlite.org/download.html
# Mac: komt standaard mee
# Linux: sudo apt-get install sqlite3

# Maak database en vul met data
sqlite3 juwelier.db < database.sql
```

### Stap 4: Environment variabelen (optioneel)

Het `.env` bestand bestaat al en hoeft niet aangepast te worden!

Standaard configuratie:
```env
PORT=3000
```

Als je de port wilt wijzigen, pas het `.env` bestand aan.

### Stap 5: Start de server

**Development mode (aanbevolen - met automatisch herstarten bij code wijzigingen):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Stap 6: Controleer of het werkt ✅

Je zou dit moeten zien in de terminal:
```
✅ Database verbinding succesvol (SQLite)
🚀 Server draait op http://localhost:3000
📚 API documentatie: http://localhost:3000
```

Open je browser en test:
- **http://localhost:3000** → Zie de uitgebreide API documentatie
- **http://localhost:3000/api/products** → Zie alle 15 producten in JSON formaat
- **http://localhost:3000/api/categories** → Zie alle 5 categorieën

**Als je data ziet → Alles werkt perfect!** 🎉

## 📚 API Documentatie

Bezoek `http://localhost:3000` voor de volledige interactieve API documentatie met voorbeelden.

### Belangrijkste Endpoints

#### Products Endpoints
- `GET /api/products` - Alle producten (met paginatie, sorting, filtering)
- `GET /api/products/search` - Geavanceerd zoeken op meerdere criteria
- `GET /api/products/in-stock` - Alleen voorraad producten
- `GET /api/products/out-of-stock` - Uitverkochte producten
- `GET /api/products/:id` - Specifiek product ophalen
- `POST /api/products` - Nieuw product toevoegen
- `PUT /api/products/:id` - Product updaten (partial update mogelijk)
- `DELETE /api/products/:id` - Product verwijderen

#### Query Parameters voor GET /api/products
| Parameter | Type | Beschrijving | Voorbeeld |
|-----------|------|--------------|-----------|
| `limit` | number | Aantal resultaten (default: 10) | `?limit=20` |
| `offset` | number | Startpositie (default: 0) | `?offset=10` |
| `sort` | string | Sorteer op: id, name, price, stock, created_at | `?sort=price` |
| `order` | string | Volgorde: asc of desc (default: asc) | `?order=desc` |
| `name` | string | Filter op productnaam | `?name=ring` |
| `description` | string | Filter op beschrijving | `?description=goud` |
| `min_price` | number | Minimum prijs | `?min_price=100` |
| `max_price` | number | Maximum prijs | `?max_price=500` |
| `in_stock` | boolean | Filter op voorraad (true/false) | `?in_stock=true` |
| `category_id` | number | Filter op categorie | `?category_id=1` |

**Voorbeelden:**
```bash
# Duurste producten eerst
GET /api/products?sort=price&order=desc

# Ringen tussen €100 en €500
GET /api/products?name=ring&min_price=100&max_price=500

# Producten op voorraad in categorie "Ringen"
GET /api/products?category_id=1&in_stock=true

# Paginatie: tweede pagina met 5 resultaten
GET /api/products?limit=5&offset=5
```

#### Categories Endpoints
- `GET /api/categories` - Alle categorieën (met sorting)
- `GET /api/categories/with-counts` - Categorieën met aantal producten per categorie
- `GET /api/categories/:id` - Specifieke categorie (inclusief product count)
- `GET /api/categories/:id/products` - Alle producten in een categorie (met filters)
- `POST /api/categories` - Nieuwe categorie toevoegen
- `PUT /api/categories/:id` - Categorie updaten
- `DELETE /api/categories/:id` - Categorie verwijderen

## ✅ Functionele Requirements

### Minimum Requirements
- [x] **Twee CRUD interfaces** - Products & Categories met volledige CRUD
- [x] **Basisvalidatie** - Lege velden, numerieke controles, data types
- [x] **Limit en offset** - `GET /api/products?limit=10&offset=0` voor paginatie
- [x] **Zoeken op veld** - `GET /api/products/search?q=ring`
- [x] **API documentatie** - Uitgebreide HTML documentatie op root URL

### Extra Features Geïmplementeerd

#### 🔒 Geavanceerde Validatie
- Minimale/maximale lengtes voor alle tekstvelden
- Custom error messages per validatiefout met field indicator
- Prijs range validatie (€0 - €1.000.000)
- Geheel getal validatie voor voorraad
- Unieke naam check voor categorieën (case-insensitive)
- Foreign key validatie (category_id moet bestaan)
- Alleen letters toegestaan in categorie namen (geen cijfers)
- Beschrijving max 500 karakters

**Voorbeeld validatie response:**
```json
{
  "success": false,
  "error": "Validatie error",
  "field": "name",
  "message": "Naam moet minstens 3 karakters bevatten"
}
```

#### 🔍 Zoeken op Meerdere Velden
- Zoek gelijktijdig op naam EN beschrijving
- Combineer tekstueel zoeken met prijs filtering
- Filter op voorraad status (in stock / out of stock)
- Filter op specifieke categorie
- Alle filters zijn combineerbaar

**Voorbeeld:**
```bash
GET /api/products?name=ring&description=goud&min_price=500&max_price=2000&in_stock=true
```

#### 🔄 Sorteren van Resultaten
- Sort by: id, name, price, stock, created_at
- Ascending of descending order
- Werkt op alle lijst endpoints (products, categories)

**Voorbeeld:**
```bash
GET /api/products?sort=price&order=desc
GET /api/categories?sort=name&order=asc
```

#### 🎯 Uitgebreid Filteren
- Min/max prijs ranges
- In stock / out of stock filtering
- Filter per categorie
- Alle filters zijn combineerbaar met sorting

#### 📊 Betere Response Structuur
- Consistente `success` boolean in alle responses
- Uitgebreide `meta` data (pagination, filters, sorting info)
- Specifieke error messages met field indicator
- Complete pagination info (page, totalPages, hasMore, count)

**Voorbeeld response:**
```json
{
  "success": true,
  "data": ["..."],
  "meta": {
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 15,
      "count": 10,
      "hasMore": true,
      "page": 1,
      "totalPages": 2
    },
    "filters": {
      "searchName": "ring",
      "minPrice": 100,
      "maxPrice": 500
    },
    "sorting": {
      "sortBy": "price",
      "order": "ASC"
    }
  }
}
```

#### ➕ Extra Endpoints
- `/api/products/in-stock` - Alleen producten op voorraad
- `/api/products/out-of-stock` - Alleen uitverkochte producten
- `/api/categories/with-counts` - Categorieën met product count
- `/api/categories/:id/products` - Categorie-specifieke product listings met alle filters

## 🧪 API Testen

### Optie 1: Browser (voor GET requests)
Open je browser en test:
```
http://localhost:3000/api/products
http://localhost:3000/api/products?sort=price&order=desc
http://localhost:3000/api/products/search?q=ring
http://localhost:3000/api/categories/with-counts
```

### Optie 2: cURL (command line)
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

# Product verwijderen
curl -X DELETE http://localhost:3000/api/products/16

# Test validatie (moet error geven)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"AB","price":-10}'
```

### Optie 3: PhpStorm HTTP Client (AANBEVOLEN)
1. Maak een bestand `test.http` aan in je project root
2. Kopieer onderstaande test requests:

```http
### Test 1: Alle producten
GET http://localhost:3000/api/products

### Test 2: Producten gesorteerd op prijs (duurste eerst)
GET http://localhost:3000/api/products?sort=price&order=desc

### Test 3: Geavanceerd zoeken
GET http://localhost:3000/api/products/search?q=goud&min_price=500&max_price=2000

### Test 4: Producten op voorraad
GET http://localhost:3000/api/products/in-stock

### Test 5: Categorieën met product count
GET http://localhost:3000/api/categories/with-counts

### Test 6: Product toevoegen (SUCCESS)
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "Nieuwe ring",
  "description": "Prachtige gouden ring",
  "price": 199.99,
  "stock": 5,
  "category_id": 1
}

### Test 7: Product toevoegen met validatie error (naam te kort)
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "AB",
  "price": 99.99
}

### Test 8: Product updaten (partial update)
PUT http://localhost:3000/api/products/1
Content-Type: application/json

{
  "stock": 15,
  "price": 179.99
}

### Test 9: Product verwijderen
DELETE http://localhost:3000/api/products/16

### Test 10: Producten filteren op meerdere criteria
GET http://localhost:3000/api/products?min_price=100&max_price=500&in_stock=true&sort=price&category_id=1

### Test 11: Categorie met producten
GET http://localhost:3000/api/categories/1/products?sort=price&order=desc
```

3. Klik op de groene **play button** ▶️ naast elke test
4. Zie de response in het onderste paneel

### Optie 4: Postman
1. Download: https://www.postman.com/downloads/
2. Import de endpoints vanuit de documentatie
3. Test alle CRUD operaties

## 📁 Project Structuur

```
Opdracht-Backend-Web-Node/
├── node_modules/           # Dependencies (niet in git)
├── src/
│   ├── config/
│   │   └── database.js     # SQLite database connectie & helpers
│   └── routes/
│       ├── products.js     # Product CRUD routes met validatie
│       └── categories.js   # Categorie CRUD routes met validatie
├── public/
│   └── index.html          # Uitgebreide API documentatie (HTML)
├── .env                    # Environment variabelen (PORT=3000)
├── .gitignore              # Git ignore (node_modules, .env)
├── database.sql            # SQLite database schema + seed data
├── juwelier.db             # SQLite database bestand (gegenereerd)
├── package.json            # NPM dependencies & scripts
├── package-lock.json       # Dependency lock file
├── server.js               # Hoofdbestand - Express server setup
├── setup-db.js             # Database setup script (optioneel)
└── README.md               # Deze file
```

## 🔧 Technologieën

| Technologie | Versie | Gebruik |
|------------|--------|---------|
| **Node.js** | v20+ | JavaScript runtime |
| **Express** | v4.18+ | Web framework voor routing |
| **SQLite3** | v5.1+ | Embedded database (file-based) |
| **dotenv** | v16+ | Environment variabelen beheer |
| **cors** | v2+ | Cross-Origin Resource Sharing |
| **nodemon** | v3+ | Auto-restart tijdens development |

### Waarom deze stack?
- **Node.js + Express:** Standaard voor moderne web APIs, uitstekende performance
- **SQLite:** Geen aparte database server nodig, ideaal voor development en kleine projecten
- **RESTful design:** Industry standard voor API ontwerp
- **Modern JavaScript:** Async/await, arrow functions, destructuring

## 📝 Bronvermeldingen

### AI Assistentie
- **Claude Sonnet 4.5** (Anthropic) - Voor code structuur, validatie logica en debugging
  - Chat link: https://claude.ai/share/65f0718e-83a1-4394-b69c-395a8c821ecd
  
### Documentatie & Tutorials
- **Node.js Official Docs:** https://nodejs.org/docs/
- **Express.js Documentatie:** https://expressjs.com/
- **Express.js Tutorial (W3Schools):** https://www.w3schools.com/nodejs/nodejs_express.asp
- **SQLite3 NPM Package:** https://www.npmjs.com/package/sqlite3
- **SQLite Documentation:** https://sqlite.org/docs.html
- **SQLite How It Works:** https://sqlite.org/howitworks.html

### Video Tutorials
- **Node.js Korte Uitleg (YouTube):** https://youtu.be/ENrzD9HAZK4
- **Node.js Uitgebreide Tutorial (YouTube):** https://youtu.be/TlB_eWDSMt4

### Best Practices
- **Node.js Best Practices (GitHub):** https://github.com/goldbergyoni/nodebestpractices
  - Error handling
  - Project structuur
  - Security best practices

### Specifieke Topics
- **RESTful API Design:** https://restfulapi.net/
- **HTTP Status Codes:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- **CORS Explained:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## 🎯 Toekomstige Uitbreidingen

Mogelijke features voor verdere ontwikkeling:

### Authenticatie & Beveiliging
- [ ] JWT authenticatie voor protected endpoints
- [ ] Rate limiting om abuse te voorkomen
- [ ] API keys voor externe toegang
- [ ] Role-based access control (admin vs user)

### Product Features
- [ ] Image upload voor producten (met Multer)
- [ ] Multiple images per product
- [ ] Product reviews en ratings systeem
- [ ] Related products suggesties
- [ ] Product tags en labels

### E-commerce Features
- [ ] Shopping cart functionaliteit
- [ ] Wishlist per gebruiker
- [ ] Order management systeem
- [ ] Payment integration (Stripe/Mollie)
- [ ] Inventory tracking en automatische voorraad updates

### Performance & Scaling
- [ ] Redis caching voor veel opgevraagde data
- [ ] Database indexen voor snellere queries
- [ ] Migratie naar PostgreSQL voor productie
- [ ] API response compression
- [ ] GraphQL endpoint als alternatief voor REST

### User Experience
- [ ] Email notificaties (product back in stock)
- [ ] Product export naar CSV/Excel
- [ ] Advanced filtering (meerdere categorieën, price ranges)
- [ ] Product comparison feature

## 👤 Auteur

**Quinten Lauwers**  
Student Toegepaste Informatica
Erasmus hogeschool Brussel

## 📄 Licentie

Dit project is gemaakt voor educatieve doeleinden als onderdeel van de cursus Backend Web .

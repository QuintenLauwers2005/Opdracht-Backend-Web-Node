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
- `GET /api/products` - Alle producten (met limit/offset)
- `GET /api/products/search?q=ring` - Zoeken op naam/beschrijving
- `GET /api/products/:id` - Specifiek product
- `POST /api/products` - Nieuw product toevoegen
- `PUT /api/products/:id` - Product updaten
- `DELETE /api/products/:id` - Product verwijderen

#### Categories
- `GET /api/categories` - Alle categorieën
- `GET /api/categories/:id` - Specifieke categorie
- `GET /api/categories/:id/products` - Producten in categorie
- `POST /api/categories` - Nieuwe categorie
- `PUT /api/categories/:id` - Categorie updaten
- `DELETE /api/categories/:id` - Categorie verwijderen

## ✅ Functionele Requirements (checklist)

- [x] Twee CRUD interfaces (Products & Categories)
- [x] Basisvalidatie (lege velden, numerieke controles)
- [x] Limit en offset endpoint (`GET /api/products?limit=10&offset=0`)
- [x] Zoeken op veld (`GET /api/products/search?q=ring`)
- [x] API documentatie pagina op root URL

### Extra features voor hoger cijfer
- [ ] Geavanceerde validatie
- [ ] Zoeken op meerdere velden
- [ ] Sorteren van resultaten
- [ ] Authenticatie
- [ ] ...

## 🧪 API Testen

### Met cURL (command line)
```bash
# Alle producten ophalen
curl http://localhost:3000/api/products

# Product toevoegen
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test product","price":99.99,"stock":10}'
```

### Met PhpStorm HTTP Client
1. Tools → HTTP Client → Create Request
2. Maak een `.http` bestand aan met:
```http
### Alle producten
GET http://localhost:3000/api/products

### Product toevoegen
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "Nieuwe ring",
  "price": 199.99,
  "stock": 5,
  "category_id": 1
}
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
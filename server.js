require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api', (req, res) => {
    res.json({
        message: 'Welkom bij de Juwelier API',
        version: '1.0.0',
        endpoints: {
            documentation: '/',
            products: '/api/products',
            categories: '/api/categories'
        }
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Er is iets misgegaan!',
        message: err.message
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint niet gevonden' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
    console.log(`API documentatie: http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dishes', require('./routes/dishes'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🍽️ 点餐系统服务端启动: http://localhost:${PORT}`);
});

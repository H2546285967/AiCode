const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'ordering.db');
let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      price REAL NOT NULL,
      image TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      sales INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      dish_id INTEGER REFERENCES dishes(id),
      quantity INTEGER DEFAULT 1,
      price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      order_no TEXT UNIQUE NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      dish_id INTEGER REFERENCES dishes(id),
      dish_name TEXT,
      price REAL,
      quantity INTEGER
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.exec("SELECT id FROM admins WHERE username = 'admin'");
  if (adminExists.length === 0 || adminExists[0].values.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO admins (username, password, role) VALUES (?, ?, 'super')", ['admin', hash]);
  }

  const catCount = db.exec("SELECT COUNT(*) as c FROM categories");
  if (catCount.length === 0 || catCount[0].values[0][0] === 0) {
    db.run("INSERT INTO categories (name, sort) VALUES ('川菜', 1)");
    db.run("INSERT INTO categories (name, sort) VALUES ('粤菜', 2)");
    db.run("INSERT INTO categories (name, sort) VALUES ('湘菜', 3)");
    db.run("INSERT INTO categories (name, sort) VALUES ('甜品', 4)");
    db.run("INSERT INTO categories (name, sort) VALUES ('饮品', 5)");
  }

  const dishCount = db.exec("SELECT COUNT(*) as c FROM dishes");
  if (dishCount.length === 0 || dishCount[0].values[0][0] === 0) {
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['麻婆豆腐', 1, 28, '', '麻辣鲜香，入口即化', 120]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['宫保鸡丁', 1, 38, '', '经典川菜，甜辣适中', 98]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['白切鸡', 2, 48, '', '原汁原味，皮滑肉嫩', 85]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['腊味煲仔饭', 2, 35, '', '广式经典，香气四溢', 76]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['剁椒鱼头', 3, 68, '', '鲜辣开胃，肉质鲜美', 62]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['芒果布丁', 4, 18, '', '清爽可口', 150]);
    db.run("INSERT INTO dishes (name, category_id, price, image, description, sales) VALUES (?, ?, ?, ?, ?, ?)", ['酸梅汤', 5, 12, '', '解暑解腻', 200]);
  }

  saveDB();
  console.log('✅ 数据库初始化完成');
  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDB() {
  return db;
}

function closeDB() {
  if (db) { saveDB(); db.close(); }
}

initDB();

module.exports = { getDB, saveDB, closeDB };

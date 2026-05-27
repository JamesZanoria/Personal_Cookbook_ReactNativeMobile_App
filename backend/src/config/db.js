// Shared across all controllers
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'da_user',
    password: process.env.DB_PASSWORD || 'da_pass123',
    database: process.env.DB_NAME || 'digital_atelier',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: false,
    typeCast(field, next){
        if(field.type === 'JSON'){
            const val = field.string();
            try{
                return JSON.parse(val);
            } catch{
                return val;
            }
        }
        return next();
    },
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log('MySQL connected');
        conn.release();
    })
    .catch(err => {
        console.error('MySQL connection failed:', err.message);
    });

module.exports = pool;
const { Pool } = require ('pg')
const pool = new Pool ({
    user: 'alam',
    host: 'localhost',
    database: 'posdb',
    password: '12345',
    port: '5432'
})

module.exports = pool
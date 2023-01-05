const db = require('../models/index')
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.register = async (req, res) => {
    try {
        const { name, email, password, repassword } = req.body

        //cek password
        if (password != repassword) {
            throw 'password tidak sama'
        }

        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length > 0) {
            throw "email email telah terdaftar"
        }
        
        //hashing
        const hash = bcrypt.hashSync(password, saltRounds);

        //register
        const createUser = await db.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [name, email, hash])

        res.redirect('/login')
    } catch (e) {
        res.send(e)
    }
}
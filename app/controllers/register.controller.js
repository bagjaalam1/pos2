const db = require('../models/index')

exports.register = async (req, res) => {
    try {
        const { name, email, password, repassword } = req.body
        console.log(name, email, password, repassword)
        //cek password
        if (password != repassword) {
            throw 'password tidak sama'
        }
        console.log(password)
        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length > 0) {
            throw "email email telah terdaftar"
        }
        console.log(rows)
        //register
        const createUser = await db.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [name, email, password])

        res.redirect('/login')
    } catch (e) {
        res.send(e)
    }
}
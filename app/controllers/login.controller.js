const db = require('../models/index')

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length == 0) {
            throw "email email tidak terdaftar"
        }
        
        //cek password
        if(rows[0].password != password){
            throw "password salah!"
        }

        res.redirect('/')
    } catch (e) {
        res.send(e)
    }
}
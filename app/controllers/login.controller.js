const db = require('../models/index')
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length == 0) {
            throw "email tidak terdaftar"
        }
        
        //cek password
        const match = await bcrypt.compare(password, rows[0].password);
        if(!match){
            throw 'password salah'
        }

        req.session.user = rows[0]
        res.redirect('/')
    } catch (e) {
        req.flash('info', e)
        res.redirect('login')
    }
}

exports.getLogin = (req, res) => {
    res.render('login', {info: req.flash('info'), infoSuccess: req.flash('infoSuccess') })
}
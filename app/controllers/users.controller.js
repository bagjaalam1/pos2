const db = require('../models/index')
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
        if (!match) {
            throw 'password salah'
        }

        if (req.body.remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
        } else {
            req.session.cookie.expires = false; // Cookie expires at end of session
        }

        req.session.user = rows[0]
        console.log(req.session)
        res.redirect('/')
    } catch (e) {
        req.flash('info', e)
        res.redirect('login')
    }
}

exports.getLogin = (req, res) => {
    res.render('login', { info: req.flash('info'), infoSuccess: req.flash('infoSuccess') })
}

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
            throw "email telah terdaftar"
        }

        //hashing
        const hash = bcrypt.hashSync(password, saltRounds);

        //register
        const createUser = await db.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [name, email, hash])

        req.flash('infoSuccess', "Berhasil didaftarkan, silakan login")
        res.redirect('/login')
    } catch (e) {
        req.flash('info', e)
        res.redirect('register')
    }
}

exports.getRegister = (req, res) => {
    res.render('register', { info: req.flash('info') })
}

exports.logout = (req, res) => {
    req.session.destroy(function (err) {
        res.redirect('/login')
    })
}

exports.dashboard = async (req, res) => {
    try {
        const user = req.session.user
        res.render('dashboard', { name: user.name })
    } catch (e) {
        res.send(e)
    }
}

exports.users = async (req, res) => {
    try {
        const user = req.session.user
        res.render('users', { name: user.name })
    } catch (e) {
        res.send(e)
    }
}
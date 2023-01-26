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
        const {} = req.query

        const field = ['userid', 'email', 'name', 'role'];

        const sortBy = field.includes(req.query.sortBy) ? req.query.sortBy : 'userid';
        const sortMode = req.query.sortMode === 'desc' ? -1 : 1;

        const url = req.url == '/' ? '/?page=1&sortBy=id&sortMode=asc' : req.url

        let page = req.query.page || 1
        const limit = req.query.display == 'all' ? 0 : req.query.display || 3;
        const offset = page > 0 ? (page - 1) * limit : page = 1;

        const totalResult = await db.query('SELECT COUNT(*) AS total FROM users')
        const pages = Math.ceil(totalResult.rows[0].total / limit)

        sql = 'SELECT * FROM users'
        sql += ` LIMIT ${limit} OFFSET ${offset}`
        const { rows } = await db.query(sql)
        res.render('users', { name: user.name, rows: rows, page, pages, url, limit, offset, totalResult: totalResult.rows[0].total })
    } catch (e) {
        res.send(e)
    }
}
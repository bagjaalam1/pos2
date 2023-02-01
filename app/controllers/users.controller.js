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
        // Ambil data user dari session
        const user = req.session.user;
        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'userid'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/users/' ||
                req.url === `/users?searchValue=${searchValue}&display=${display}` ||
                req.url === `/users?display=${display}`
                ? `/users?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
                : req.url;

        // Halaman saat ini
        let page = req.query.page || 1;
        // Batas tampilan
        const limit = req.query.display || 3
        // Offset tampilan
        const offset = page > 0 ? (page - 1) * limit : (page = 1);

        // Kondisi pencarian
        const wheres = [];
        // Nilai pencarian
        const values = [];
        // Jika ada pencarian
        if (searchValue) {
            wheres.push(`
          name ilike '%' || $1 || '%' OR
          email ilike '%' || $2 || '%'`);
            values.push(searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(*) AS total FROM users';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);

        // Query untuk mengambil data
        sql = 'SELECT * FROM users';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./users/users', {
            name: user.name,
            rows,
            page,
            pages,
            url,
            limit,
            offset,
            display,
            sortBy,
            sortMode,
            totalResult: totalResult.rows[0].total,
            infoSuccess: req.flash('infoSuccess'),
            searchValue: searchValue || '',
        })
    } catch (e) {
        res.send(e)
    }
}

exports.getAddUser = async (req, res) => {
    try {
        const user = req.session.user
        res.render('./users/addUser.ejs', { name: user.name, info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.addUser = async (req, res) => {
    try {
        const { email, name, password, roleRadio } = req.body

        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length > 0) {
            throw "email telah terdaftar"
        }

        //hashing
        const hash = bcrypt.hashSync(password, saltRounds);

        //register
        const createUser = await db.query('INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4)', [name, email, hash, roleRadio])

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/users')
    } catch (e) {
        req.flash('info', e)
        res.redirect('/users/add')
    }
}

exports.getEditUser = async (req, res) => {
    try {
        const user = req.session.user
        const { userid } = req.params
        const { rows } = await db.query('SELECT * FROM users WHERE userid = $1', [userid])
        res.render('users/editUser.ejs', { name: user.name, item: rows[0], info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.editUser = async (req, res) => {
    try {
        const { name, email, roleRadio } = req.body
        const { userid } = req.params

        //cek email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (rows.length > 0) {
            throw "Email sudah ada"
        }

        const editUser = await db.query(`UPDATE users SET 
        name = $1,
        email= $2,
        role = $3
        WHERE userid = $4`,
            [name, email, roleRadio, userid])

        res.redirect('/users')
    } catch (e) {
        req.flash('info', e)
        res.redirect(`/users/edit/${req.params.userid}`)
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { userid } = req.params

        const deleteUser = await db.query('DELETE FROM users WHERE userid = $1', [userid])

        res.redirect('/users')
    } catch (e) {
        res.send(e)
    }
}
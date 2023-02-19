const db = require('../models/index')

exports.getUnits = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { name, role } = req.session.user

        // Validasi Role
        if (role != 'admin') {
            return res.status(403).send('Forbidden');
        }

        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'unit'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/units/' ||
            req.url === '/units' ||
                req.url === `/units?searchValue=${searchValue}&display=${display}` ||
                req.url === `/units?display=${display}`
                ? `/units?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            unit ilike '%' || $1 || '%' OR
            name ilike '%' || $2 || '%' OR
            note ilike '%' || $3 || '%'`);
            values.push(searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(*) AS total FROM units';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);

        // Query untuk mengambil data
        sql = 'SELECT * FROM units';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./units/units', {
            name,
            role,
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

exports.getAddUnit = async (req, res) => {
    try {
        const { name, role } = req.session.user

        // Validasi Role
        if (role != 'admin') {
            return res.status(403).send('Forbidden');
        }
        
        res.render('units/addUnit', { name, role, info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.addUnit = async (req, res) => {
    try {
        const { unit, name, note } = req.body

        // Add Unit
        const createUser = await db.query('INSERT INTO units(unit, name, note) VALUES($1, $2, $3)', [unit, name, note])

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/units')
    } catch (e) {
        req.flash('info', e)
        res.redirect('/units/add')
    }
}

exports.getEditUnit = async (req, res) => {
    try {
        const { name, role } = req.session.user

        // Validasi Role
        if (role != 'admin') {
            return res.status(403).send('Forbidden');
        }

        const { unit } = req.params
        const { rows } = await db.query('SELECT * FROM units WHERE unit = $1', [unit])
        res.render('units/editUnit.ejs', { name, role, item: rows[0], info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.editUnit = async (req, res) => {
    try {
        const { unitValue, name, note } = req.body
        const { unit } = req.params

        //cek unit
        const { rows } = await db.query('SELECT * FROM units WHERE unit = $1', [unitValue])
        if (rows.length > 0) {
            throw "unit sudah ada"
        }

        const editUnit = await db.query(`UPDATE units SET 
        unit = $1,
        name = $2,
        note = $3
        WHERE unit = $4`,
            [unitValue, name, note, unit])

        res.redirect('/units')
    } catch (e) {
        req.flash('info', e)
        res.redirect(`/units/edit/${req.params.unit}`)
    }
}

exports.deleteUnit = async (req, res) => {
    try {
        const { unit } = req.params

        const deleteUser = await db.query('DELETE FROM units WHERE unit = $1', [unit])

        res.redirect('/units')
    } catch (e) {
        res.send(e)
    }
}
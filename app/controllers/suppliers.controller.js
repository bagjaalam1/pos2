const db = require('../models/index')
const path = require('path')

exports.getSuppliers = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { name, role } = req.session.user

        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'supplierid'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/suppliers' ||
            req.url === '/suppliers/' ||
                req.url === `/suppliers?searchValue=${searchValue}&display=${display}` ||
                req.url === `/suppliers?display=${display}`
                ? `/suppliers?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            (supplierid::text ILIKE '%' || $1 || '%') OR
            name ILIKE '%' || $2 || '%' OR  
            address ILIKE '%' || $3 || '%' OR
            phone ILIKE '%' || $4 || '%'`);
            values.push(searchValue, searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(*) AS total FROM suppliers';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);


        // Query untuk mengambil data
        sql = 'SELECT * FROM suppliers';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./suppliers/suppliers', {
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
        console.error(e)
        res.send(e)
    }

}

exports.getAddSupplier = async (req, res) => {
    try {
        const { name, role } = req.session.user

        res.render('suppliers/addSuppliers', { name, role, info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.addSupplier = async (req, res) => {
    try {
        const { name, address, phone } = req.body

        // Add Supplier
        const addGoods = await db.query('INSERT INTO suppliers(name, address, phone) VALUES($1, $2, $3)', [name, address, phone])

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/suppliers')
    } catch (e) {
        res.send(e)
    }
}

exports.getEditSupplier = async (req, res) => {
    try {
        const { name, role } = req.session.user
        const { supplierid } = req.params
        const { rows } = await db.query('SELECT * FROM suppliers WHERE supplierid = $1', [supplierid])

        res.render('suppliers/editSuppliers.ejs', { name, role, item: rows[0], info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.editSupplier = async (req, res) => {
    try {
        const { name, address, phone } = req.body
        const { supplierid } = req.params

        const editSuplier = await db.query(`UPDATE suppliers SET 
                name = $1,
                address = $2,
                phone = $3
                WHERE supplierid = $4`,
            [name, address, phone, supplierid])

        res.redirect('/suppliers')
    } catch (e) {
        res.send(e)
        // req.flash('info', e)
        // res.redirect(`/suppliers/edit/${req.params.supplierid}`)
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        const { supplierid } = req.params

        // Hapus Data dari Database
        const deleteGoods = await db.query('DELETE FROM suppliers WHERE supplierid = $1', [supplierid])

        res.redirect('/suppliers')
    } catch (e) {
        console.error(e);
        res.send('Terjadi error. Proses penghapusan barang dan file gambar dibatalkan.');
    }
}
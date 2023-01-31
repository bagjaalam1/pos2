const db = require('../models/index')
const { IDRupiah } = require('../../helpers/util')

exports.getGoods = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { user } = req.session

        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'barcode'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/goods' ||
                req.url === `/goods?searchValue=${searchValue}&display=${display}` ||
                req.url === `/goods?display=${display}`
                ? `/goods?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            barcode ILIKE '%' || $1 || '%' OR
            name ILIKE '%' || $2 || '%' OR
            unit ILIKE '%' || $3 || '%' OR
            (stock::text ILIKE '%' || $4 || '%') OR
            (purchaseprice::text ILIKE '%' || $5 || '%') OR
            (sellingprice::text ILIKE '%' || $6 || '%')`);
            values.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(*) AS total FROM goods';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);


        // Query untuk mengambil data
        sql = 'SELECT * FROM goods';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./goods/goods', {
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
            IDRupiah,
            totalResult: totalResult.rows[0].total,
            infoSuccess: req.flash('infoSuccess'),
            searchValue: searchValue || '',
        })


    } catch (e) {
        res.send(e)
    }

}

exports.getAddGood = async (req, res) => {
    try {
        const user = req.session.user

        // Ambil Data Units
        const { rows } = await db.query('SELECT unit FROM units')

        res.render('goods/addGood', { name: user.name, info: req.flash('info'), rows })
    } catch (e) {
        res.send(e)
    }
}

exports.addGood = async (req, res) => {
    try {
        const { barcode, name, stock, purchaseprice, sellingprice, unit, picture } = req.body
        console.log(picture)

        // Add Goods
        const createUser = await db.query('INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES($1, $2, $3, $4, $5, $6, $7)', [barcode, name, stock, purchaseprice, sellingprice, unit, picture])
        console.log(picture)

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/goods')
    } catch (e) {
        req.flash('info', e)
        res.redirect('/goods/add')
    }
}
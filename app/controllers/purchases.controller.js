const db = require('../models/index')
const { IDRupiah } = require('../../helpers/util')
const moment = require('moment')

exports.getPurchases = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { user } = req.session

        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'invoice'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/purchases' ||
                req.url === `/purchases?searchValue=${searchValue}&display=${display}` ||
                req.url === `/purchases?display=${display}`
                ? `/purchases?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            invoice ILIKE '%' || $1 || '%' OR
            time::text ILIKE '%' || $2 || '%' OR
            totalsum::text ILIKE '%' || $3 || '%' OR
            name ILIKE '%' || $4 || '%'`);
            values.push(searchValue, searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(purchases.invoice) AS total FROM purchases INNER JOIN suppliers ON purchases.supplier = suppliers.supplierid';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        console.log(sql)
        console.log(values)
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);
        console.log(totalResult)
        console.log(pages)

        // Query untuk mengambil data
        sql = 'SELECT purchases.invoice, purchases.time, purchases.totalsum, suppliers.name FROM purchases INNER JOIN suppliers ON purchases.supplier = suppliers.supplierid';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./purchases/purchases', {
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
            moment,
            totalResult: totalResult.rows[0].total,
            infoSuccess: req.flash('infoSuccess'),
            searchValue: searchValue || '',
        })


    } catch (e) {
        console.error(e)
        res.send(e)
    }

}

exports.postPurchases = async (req, res) => {
    const operator = req.session.user.userid
    const insert = await db.query('INSERT INTO purchases(totalsum, operator) VALUES($1, $2)', ['0', operator])
    res.redirect('/purchases/add')
}

exports.getAddPurchases = async(req, res) => {
    const { user } = req.session
    res.json({name: user.name})
}
const db = require('../models/index')
const { IDRupiah } = require('../../helpers/util')
const moment = require('moment')

exports.getSales = async (req, res) => {
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
            req.url === '/sales/' ||
            req.url === '/sales' ||
                req.url === `/sales?searchValue=${searchValue}&display=${display}` ||
                req.url === `/sales?display=${display}`
                ? `/sales?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            pay::text ILIKE '%' || $4 || '%' OR
            change::text ILIKE '%' || $5 || '%' OR
            name ILIKE '%' || $6 || '%'`);
            values.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(sales.invoice) AS total FROM sales INNER JOIN customers ON sales.customer = customers.customerid';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);

        // Query untuk mengambil data
        sql = 'SELECT sales.invoice, sales.time, sales.totalsum, sales.pay, sales.change, customers.name FROM sales INNER JOIN customers ON sales.customer = customers.customerid';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./sales/sales', {
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

exports.postSales = async (req, res) => {
    const operator = req.session.user.userid
    const insert = await db.query('INSERT INTO sales(totalsum, pay, change, operator) VALUES($1, $2, $3, $4)', 
    ['0', '0', '0', operator])
    res.redirect('/sales/add')
}

exports.getAddSales = async(req, res) => {
    const { user } = req.session
    res.render('./sales/salesAdd', {name: user.name})
}

// API
exports.getAPIAddSales = async(req, res) => {
    const operator = req.session.user

    // Ambil Data Goods
    async function getGoodsData() {
        const { rows } = await db.query('SELECT * FROM goods')
        const goodsData = rows
        return goodsData
    }
    const goodsData = await getGoodsData()
    
    // ambil data sales terbaru
    async function getSalesData() {
        const { rows } = await db.query('SELECT * FROM sales ORDER BY time ASC')
        const salesData = rows.pop()
        return salesData
    }
    const salesData = await getSalesData()
    const invoice = salesData.invoice
    
    // Ambil Data saleitems & nama barang berdasarkan invoice
    async function getSaleitems (invoice) {
        const { rows } = await db.query(`SELECT saleitems.id, saleitems.itemcode, goods.name, quantity, saleitems.sellingprice, totalprice
        FROM saleitems
        INNER JOIN goods ON saleitems.itemcode = goods.barcode
        WHERE invoice = $1
        ORDER BY id ASC`, [invoice])
        const saleitems = rows
        return saleitems
    }
    const saleitems = await getSaleitems(invoice)

    // Ambil Data Customers
    async function getCustomersData () {
        const { rows } = await db.query('SELECT * FROM customers')
        const customersData = rows
        return customersData
    }
    const customersData = await getCustomersData()
    
    res.json({salesData, operator, goodsData, saleitems, customersData})
}

exports.putAPIAddSales = async (req, res) => {
    const { barcode, quantity, sellingPriceNumber, totalPriceNumber, invoice } = req.body

    const addPurchaseitems = await db.query('INSERT INTO saleitems(invoice, itemcode, quantity, sellingprice, totalprice) VALUES ($1, $2, $3, $4, $5)', [invoice, barcode, quantity, sellingPriceNumber, totalPriceNumber])

    // Ambil Data saleitems & nama barang berdasarkan invoice
    async function getPurchaseitems (invoice) {
        const { rows } = await db.query(`SELECT saleitems.id, saleitems.itemcode, goods.name, quantity, saleitems.sellingprice, totalprice
        FROM saleitems
        INNER JOIN goods ON saleitems.itemcode = goods.barcode
        WHERE invoice = $1
        ORDER BY id ASC`, [invoice])
        const saleitems = rows
        return saleitems
    }
    const saleitems = await getPurchaseitems(invoice)

    // Ambil Data totalsum
    async function getTotalsum () {
        const { rows } = await db.query('SELECT totalsum FROM sales WHERE invoice = $1', [invoice])
        const totalsum = rows
        return totalsum
    }
    const totalsum = await getTotalsum(invoice)

    res.json({saleitems, totalsum: totalsum[0].totalsum})
}
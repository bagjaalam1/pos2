const db = require('../models/index')

exports.getCustomers = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { name, role } = req.session.user

        // Ambil data dari req.query
        const { searchValue, display } = req.query;

        // Sorting
        const sortBy = req.query.sortBy || 'customerid'
        const sortMode = req.query.sortMode || 'asc'

        // URL saat ini
        const url =
            req.url === '/customers/' ||
            req.url === '/customers' ||
                req.url === `/customers?searchValue=${searchValue}&display=${display}` ||
                req.url === `/customers?display=${display}`
                ? `/customers?page=1&sortBy=${sortBy}&sortMode=${sortMode}&searchValue=${searchValue || ''}&display=${display || ''}`
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
            (customerid::text ILIKE '%' || $1 || '%') OR
            name ILIKE '%' || $2 || '%' OR  
            address ILIKE '%' || $3 || '%' OR
            phone ILIKE '%' || $4 || '%'`);
            values.push(searchValue, searchValue, searchValue, searchValue);
        }

        // Query untuk menghitung total halaman
        let sql = 'SELECT COUNT(*) AS total FROM customers';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }

        // Eksekusi query
        const totalResult = await db.query(sql, values);
        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);


        // Query untuk mengambil data
        sql = 'SELECT * FROM customers';
        // Jika ada pencarian
        if (wheres.length > 0) {
            sql += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);

        // Render halaman
        res.render('./customers/customers', {
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

exports.getAddCustomers = async (req, res) => {
    try {
        const { name, role } = req.session.user

        res.render('customers/customersAdd', { name, role, info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.addCustomers = async (req, res) => {
    try {
        const { name, address, phone } = req.body
        console.log(phone)

        // Add Supplier
        const addCustomers = await db.query('INSERT INTO customers(name, address, phone) VALUES($1, $2, $3)', [name, address, phone])

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/customers')
    } catch (e) {
        res.send(e)
    }
}

exports.getEditCustomer = async (req, res) => {
    try {
        const {name, role} = req.session.user
        const { customerid } = req.params
        const { rows } = await db.query('SELECT * FROM customers WHERE customerid = $1', [customerid])

        res.render('customers/customerEdit.ejs', { name, role, item: rows[0], info: req.flash('info') })
    } catch (e) {
        res.send(e)
    }
}

exports.editCustomer = async (req, res) => {
    try {
        const { name, address, phone } = req.body
        const { customerid } = req.params

        const editCustomer = await db.query(`UPDATE customers SET 
                name = $1,
                address = $2,
                phone = $3
                WHERE customerid = $4`,
            [name, address, phone, customerid])

        res.redirect('/customers')
    } catch (e) {
        res.send(e)
        // req.flash('info', e)
        // res.redirect(`/customers/edit/${req.params.customerid}`)
    }
}

exports.deleteCustomer = async (req, res) => {
    try {
        const { customerid } = req.params

        // Hapus Data dari Database
        const deleteCustomer = await db.query('DELETE FROM customers WHERE customerid = $1', [customerid])

        res.redirect('/customers')
    } catch (e) {
        console.error(e);
        res.send(e);
    }
}
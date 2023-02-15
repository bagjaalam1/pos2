const db = require('../models/index')
const moment = require('moment')

exports.getDashboard = async (req, res) => {
    try {
        const user = req.session.user



        res.render('dashboard', { name: user.name })
    } catch (e) {
        res.send(e)
        console.error(e)
    }
}

exports.putAPIDashboard = async (req, res) => {
    try {
        // Ambil data dari user session 
        const { user } = req.session

        // Ambil data dari req.body
        const { searchValue, display, startDate, endDate } = req.body;
        console.log(startDate)
        console.log(endDate)
        console.log(req.body)

        // Sorting
        const sortBy = req.body.sortBy || "TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY')"
        const sortMode = req.body.sortMode || 'ASC'

        // Halaman saat ini
        let page = req.body.page || 1;
        // Batas tampilan
        const limit = req.body.display || 3
        // Offset tampilan
        const offset = page > 0 ? (page - 1) * limit : (page = 1);

        const wheres = [];
        const values = [];
        let count = 1
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

        // jika input date dimasukkan
        if (startDate && endDate) {
            wheres.push(`time BETWEEN $${count++} AND $${count++}`)
            values.push(startDate)
            values.push(endDate)
        } else if (startDate) {
            wheres.push(`time >= $${count++}`)
            values.push(startDate)
        } else if (endDate) {
            wheres.push(`time <= $${count++}`)
            values.push(endDate)
        }

        let whereClause = ''
        if (wheres.length > 0) {
            whereClause += ` WHERE ${wheres.join()}`;
        }

        console.log(whereClause)
        let sql = `
        SELECT COUNT(*) AS total
        FROM (
          SELECT 
            TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'DD-MM-YYYY') AS month, 
            s.revenue, 
            p.expense
          FROM (
            SELECT 
              TO_CHAR(DATE_TRUNC('month', time), 'Mon YY') AS sales_month, 
              SUM(totalsum) AS revenue
            FROM sales
            ${whereClause}
            GROUP BY sales_month
          ) AS s
          FULL OUTER JOIN (
            SELECT 
              TO_CHAR(DATE_TRUNC('month', time), 'Mon YY') AS purchases_month, 
              SUM(totalsum) AS expense
            FROM purchases
            ${whereClause}
            GROUP BY purchases_month
          ) AS p ON s.sales_month = p.purchases_month
        ) AS result
        `;

        // Eksekusi query count
        const totalResult = await db.query(sql, values);

        // Hitung jumlah halaman
        const pages = Math.ceil(totalResult.rows[0].total / limit);
        console.log(pages)

        console.log(whereClause)
        // Query untuk mengambil data
        sql = `
        SELECT 
        TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'MM-DD-YYYY') AS month, 
        s.revenue, 
        p.expense
      FROM (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', time), 'Mon YY') AS sales_month, 
          SUM(totalsum) AS revenue
        FROM sales
        ${whereClause}
        GROUP BY sales_month
      ) AS s
      FULL OUTER JOIN (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', time), 'Mon YY') AS purchases_month, 
          SUM(totalsum) AS expense
        FROM purchases
        ${whereClause}
        GROUP BY purchases_month
      ) AS p ON s.sales_month = p.purchases_month
        `;
        // Jika ada pencarian
        if (wheres.length > 0) {
            whereClause += ` WHERE ${wheres.join()}`;
        }
        // Tambahkan limit, offset, sortby, dan sortmode
        sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;

        // Eksekusi query
        const { rows } = await db.query(sql, values);
        console.log(sql)
        console.log(values)
        console.log(rows)

        // Render halaman
        res.json({
            name: user.name,
            rows,
            page,
            pages,
            limit,
            offset,
            display,
            sortBy,
            sortMode,
            moment,
            totalResult: totalResult.rows[0].total,
            searchValue: searchValue || '',
        })


    } catch (e) {
        console.error(e)
        res.send(e)
    }
}
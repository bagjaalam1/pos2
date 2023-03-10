const db = require('../models/index')
const moment = require('moment')

exports.getDashboard = async (req, res) => {
  try {
    const { name, role } = req.session.user

    // Validasi Role
    if (role != 'admin') {
      return res.status(403).send('Forbidden');
    }

    // Ambil data untuk alerts
    let goodsAlert = null
    if (role == 'admin') {
      const goods = await db.query('SELECT * FROM goods WHERE stock <= 5')
      goodsAlert = goods.rows
    }
    res.render('dashboard', { name, role, goodsAlert })

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
    const whereSearch = [];
    const values = [];
    let whereClause = ''
    let searchClause = ''
    let count = 1
    // jika input date dimasukkan
    if (startDate && endDate) {
      wheres.push(`time BETWEEN $${count++} AND $${count++}`)
      values.push(startDate + ' 00:00:00')
      values.push(endDate + ' 23:59:59.999999')
    } else if (startDate) {
      wheres.push(`time >= $${count++}`)
      values.push(startDate + ' 00:00:00')
    } else if (endDate) {
      wheres.push(`time <= $${count++}`)
      values.push(endDate + ' 23:59:59.999999')
    }

    // Jika tanggal dimasukkan
    if (wheres.length > 0) {
      whereClause += ` WHERE ${wheres.join()}`;
    }

    // Jika ada pencarian
    if (searchValue) {
      whereSearch.push(`
      TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'Mon YY') ILIKE '%' || $${count++} || '%'
      OR s.revenue::text ILIKE '%' || $${count++} || '%'
      OR p.expense::text ILIKE '%' || $${count++} || '%'
        `);
      values.push(searchValue, searchValue, searchValue);
    }

    if (whereSearch.length > 0) {
      searchClause += ` WHERE ${whereSearch.join()}`;
    }

    let sql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT 
        TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'Mon YY') AS month, 
        COALESCE(s.revenue, 0) AS revenue, 
        COALESCE(p.expense, 0) AS expense,
        COALESCE(s.revenue, 0) - COALESCE(p.expense, 0) AS earning
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
      ${searchClause}
    ) AS result;
        `;

    // Eksekusi query count
    const totalResult = await db.query(sql, values);

    // Hitung jumlah halaman
    const pages = Math.ceil(totalResult.rows[0].total / limit);

    // Query untuk mengambil data
    sql = `
    SELECT 
  TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'Mon YY') AS month, 
  COALESCE(s.revenue, 0) AS revenue, 
  COALESCE(p.expense, 0) AS expense,
  COALESCE(s.revenue, 0) - COALESCE(p.expense, 0) AS earning
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
  ${searchClause}
        `;

    // Tambahkan limit, offset, sortby, dan sortmode
    sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`;
    // Eksekusi query
    const { rows } = await db.query(sql, values);

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

exports.putAPIEarningsData = async (req, res) => {
  // Ambil data dari user session 
  const { user } = req.session

  // Ambil data dari req.body
  const { searchValue, display, startDate, endDate } = req.body;

  // Sorting
  const sortBy = req.body.sortBy || "TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY')"
  const sortMode = req.body.sortMode || 'ASC'

  const wheres = [];
  const whereSearch = [];
  const values = [];
  let whereClause = ''
  let searchClause = ''
  let count = 1

  // jika input date dimasukkan
  if (startDate && endDate) {
    wheres.push(`time BETWEEN $${count++} AND $${count++}`)
    values.push(startDate + ' 00:00:00')
    values.push(endDate + ' 23:59:59.999999')
  } else if (startDate) {
    wheres.push(`time >= $${count++}`)
    values.push(startDate + ' 00:00:00')
  } else if (endDate) {
    wheres.push(`time <= $${count++}`)
    values.push(endDate + ' 23:59:59.999999')
  }

  // Jika tanggal dimasukkan
  if (wheres.length > 0) {
    whereClause += ` WHERE ${wheres.join()}`;
  }

  // Jika ada pencarian
  if (searchValue) {
    whereSearch.push(`
      TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'Mon YY') ILIKE '%' || $${count++} || '%'
      OR s.revenue::text ILIKE '%' || $${count++} || '%'
      OR p.expense::text ILIKE '%' || $${count++} || '%'
        `);
    values.push(searchValue, searchValue, searchValue);
  }

  if (whereSearch.length > 0) {
    searchClause += ` WHERE ${whereSearch.join()}`;
  }

  let sql = `
  SELECT 
  TO_CHAR(TO_DATE(COALESCE(p.purchases_month, s.sales_month), 'Mon YY'), 'Mon YY') AS month, 
  COALESCE(s.revenue, 0) AS revenue, 
  COALESCE(p.expense, 0) AS expense,
  COALESCE(s.revenue, 0) - COALESCE(p.expense, 0) AS earning
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
    ${searchClause}
  ORDER BY ${sortBy} ${sortMode}
      `;

  const { rows } = await db.query(sql, values);

  sql = `SELECT customer FROM sales ${whereClause}`

  //get data customer from sales
  const getData = await db.query(sql, values)
  const salesCustomer = getData.rows

  res.json({
    data: rows,
    salesCustomer
  })
}
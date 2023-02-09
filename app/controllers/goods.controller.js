const db = require('../models/index')
const { IDRupiah } = require('../../helpers/util')
const path = require('path')
const fs = require('fs')

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
            req.url === '/goods/' ||
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
        const { barcode, name, stock, purchaseprice, sellingprice, unit } = req.body

        if (!req.files || Object.keys(req.files).length === 0) {
            throw 'Tidak ada file yang dikirim'
        }

        // Ambil Data Gambar
        let picture = req.files.picture
        let pictureName = picture.name

        // Validasi ekstensi file
        let allowedExtension = ['image/jpeg', 'image/jpg', 'image/png']
        if (allowedExtension.indexOf(picture.mimetype) === -1) {
            throw 'Hanya file JPEG atau PNG yang diperbolehkan'
        }

        // Validasi ukuran file
        if (picture.size > 2 * 1024 * 1024) {
            throw 'Ukuran file tidak boleh lebih dari 2 MB'
        }

        // Validasi Nama File
        async function generateUniquePictureName(pictureName) {
            let uniquePictureName = pictureName;
            let counter = 1;

            while (true) {
                const { rows } = await db.query("SELECT name FROM goods WHERE picture = $1", [uniquePictureName]);

                if (rows.length == 0) {
                    break;
                }
                let splitPictureName = uniquePictureName.split(".");
                let extension = splitPictureName.pop();
                let name = splitPictureName.join("");
                uniquePictureName = `${name} (${counter}).${extension}`;
            }
            return uniquePictureName;
        }
        let uniquePictureName = await generateUniquePictureName(pictureName);

        // Save File Gambar ke Lokal
        const publicImagesPath = path.join(__dirname, '..', '..', 'public', 'img', 'goodsImagesSaved', `${uniquePictureName}`);
        const saveImage = await picture.mv(publicImagesPath)

        // Add Goods
        const addGoods = await db.query('INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES($1, $2, $3, $4, $5, $6, $7)', [barcode, name, stock, purchaseprice, sellingprice, unit, uniquePictureName])

        req.flash('infoSuccess', 'Berhasi ditambahkan!')
        res.redirect('/goods')
    } catch (e) {
        res.send(e)
    }
}

exports.getEditGoods = async (req, res) => {
    try {
        const user = req.session.user
        const { barcode } = req.params
        const { rows } = await db.query('SELECT * FROM goods WHERE barcode = $1', [barcode])

        // Ambil Data Unit
        async function getUnitData() {
            const { rows } = await db.query('SELECT unit FROM units')
            const unitData = rows
            return unitData
        }
        const unitData = await getUnitData()

        // Ambil Data Gambar dari Lokal
        const img = path.join(__dirname, '..', '..', 'public', 'img', 'goodsImagesSaved')

        res.render('goods/editGoods.ejs', { name: user.name, item: rows[0], info: req.flash('info'), unitData })
    } catch (e) {
        res.send(e)
    }
}

exports.editGoods = async (req, res) => {
    try {
        const { name, stock, purchaseprice, sellingprice, unit } = req.body
        const { barcode } = req.params

        if (req.files) {

            // Ambil Data Gambar
            let picture = req.files.picture
            let pictureName = picture.name

            // Validasi ekstensi file
            let allowedExtension = ['image/jpeg', 'image/jpg', 'image/png']
            if (allowedExtension.indexOf(picture.mimetype) === -1) {
                throw 'Hanya file JPEG atau PNG yang diperbolehkan'
            }

            // Validasi ukuran file
            if (picture.size > 2 * 1024 * 1024) {
                throw 'Ukuran file tidak boleh lebih dari 2 MB'
            }

            // Validasi Nama File
            async function generateUniquePictureName(pictureName) {
                let uniquePictureName = pictureName;
                let counter = 1;

                while (true) {
                    const { rows } = await db.query("SELECT picture FROM goods WHERE picture = $1", [uniquePictureName]);

                    if (rows.length == 0) {
                        break;
                    }
                    let splitPictureName = uniquePictureName.split(".");
                    let extension = splitPictureName.pop();
                    let name = splitPictureName.join("");
                    uniquePictureName = `${name} (${counter}).${extension}`;
                }
                return uniquePictureName;
            }
            let uniquePictureName = await generateUniquePictureName(pictureName);

            // Save File Gambar ke Lokal
            const publicImagesPath = path.join(__dirname, '..', '..', 'public', 'img', 'goodsImagesSaved', `${uniquePictureName}`);
            const saveImage = await picture.mv(publicImagesPath)

            const editGoods = await db.query(`UPDATE goods SET 
                barcode = $1,
                name = $2,
                stock = $3,
                purchaseprice = $4,
                sellingprice = $5,
                unit = $6,
                picture = $7
                WHERE barcode = $8`,
                [barcode, name, stock, purchaseprice, sellingprice, unit, uniquePictureName, barcode])
        } else if (!req.files) {
            const { rows } = await db.query("SELECT picture FROM goods WHERE barcode = $1", [barcode])
            const namePictureData = rows[0].picture

            const editGoods = await db.query(`UPDATE goods SET 
                barcode = $1,
                name = $2,
                stock = $3,
                purchaseprice = $4,
                sellingprice = $5,
                unit = $6,
                picture = $7
                WHERE barcode = $8`,
                [barcode, name, stock, purchaseprice, sellingprice, unit, namePictureData, barcode])
        }

        res.redirect('/goods')
    } catch (e) {
        res.send(e)
        // req.flash('info', e)
        // res.redirect(`/goods/edit/${req.params.barcode}`)
    }
}

exports.deleteGoods = async (req, res) => {
    try {
        const { barcode } = req.params

        // Ambil Data Nama File
        const { rows } = await db.query('SELECT picture FROM goods WHERE barcode = $1', [barcode])
        const namePicture = rows[0].picture

        // Hapus Data dari Database
        const deleteGoods = await db.query('DELETE FROM goods WHERE barcode = $1', [barcode])

        // Hapus Data dari direktori
        const publicImagesPath = path.join(__dirname, '..', '..', 'public', 'img', 'goodsImagesSaved', `${namePicture}`)
        fs.unlink(publicImagesPath, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });

        res.redirect('/goods')
    } catch (e) {
        console.error(e);
        res.send('Terjadi error. Proses penghapusan barang dan file gambar dibatalkan.');
    }
}
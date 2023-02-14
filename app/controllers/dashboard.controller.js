const db = require('../models/index')
const { IDRupiah } = require('../../helpers/util')
const moment = require('moment')

exports.getDashboard = async(req, res) => {
    try {
        const user = req.session.user
        res.render('dashboard', { name: user.name })
    } catch (e) {
        res.send(e)
        console.error(e)
    }
}
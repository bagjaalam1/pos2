const db = require('../models/index')

exports.dashboard = async (req, res) => {
    try {
        res.render('dashboard')
    } catch (e) {
        res.send(e)
    }
}   
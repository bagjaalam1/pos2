const db = require('../models/index')

exports.dashboard = async (req, res) => {
    try {
        console.log(req.query)
        res.render('dashboard')
    } catch (e) {
        res.send(e)
    }
}   
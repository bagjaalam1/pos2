const db = require('../models/index')

exports.register = async (req, res) => {
    try {
        const { name, email, password, repassword } = req.body
        if (password != repassword) {
            res.send('password tidak sama')
        }
    } catch (e) {
        res.send(e)
    }
}
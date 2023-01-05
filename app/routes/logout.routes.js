module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/login.controller')

    router.get('/logout', (req, res) => {
        req.session.destroy(function (err) {
            res.redirect('/login')
        })
    })

    app.use('/', router)
    return router;
}
module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/login.controller')

    router.get('/login', (req, res) => {
        res.render('login')
    })

    router.post('/login', controller.login)

    app.use('/', router)
    return router;
}
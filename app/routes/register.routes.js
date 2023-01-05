module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/register.controller')

    router.get('/register', (req, res) => {
        res.render('register')
    })

    router.post('/register', controller.register)

    app.use('/', router)
    return router;
}
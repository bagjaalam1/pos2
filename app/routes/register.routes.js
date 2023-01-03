module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/register.controller')

    router.get('/', (req, res) => {
        res.render('register')
    })

    router.post('/', controller.register)

    app.use('/register', router)
    return router;
}
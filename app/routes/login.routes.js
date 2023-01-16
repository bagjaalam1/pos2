module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/login.controller')

    router.get('/login', controller.getLogin)

    router.post('/login', controller.login)

    app.use('/', router)
    return router;
}
const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/users.controller')

    router.get('/login', controller.getLogin)

    router.post('/login', controller.login)

    router.get('/register', controller.getRegister)

    router.post('/register', controller.register)

    router.get('/logout', controller.logout)

    router.get('/', isLoggedIn, controller.dashboard)

    router.get('/users', isLoggedIn, controller.users)

    app.use('/', router)
    return router;
}
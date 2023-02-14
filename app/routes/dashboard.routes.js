const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/dashboard.controller')

    router.get('/', isLoggedIn, controller.getDashboard)

    app.use('/', router)
    return router;
}
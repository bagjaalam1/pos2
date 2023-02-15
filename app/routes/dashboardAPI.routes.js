const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/dashboard.controller')
    

    router.put('/', isLoggedIn, controller.putAPIDashboard)

    app.use('/api', router)
    return router;
}
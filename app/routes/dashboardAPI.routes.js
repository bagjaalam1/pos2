const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/dashboard.controller')
    

    router.put('/', isLoggedIn, controller.putAPIDashboard)
    router.put('/earnings', isLoggedIn, controller.putAPIEarningsData)

    app.use('/api', router)
    return router;
}
const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/purchases.controller')

    router.get('/purchases/add', isLoggedIn, controller.getAPIAddPurchases)
    router.put('/purchases/add', isLoggedIn, controller.putAPIAddPurchases)

    app.use('/api', router)
    return router;
}
const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/purchases.controller')

    router.get('/purchases', isLoggedIn, controller.getPurchases)
    router.post('/purchases', isLoggedIn, controller.postPurchases)
    router.get('/purchases/add', isLoggedIn, controller.getAddPurchases)

    app.use('/', router)
    return router;
}
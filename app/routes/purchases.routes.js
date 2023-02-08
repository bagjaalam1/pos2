const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/purchases.controller')

    router.get('/purchases', isLoggedIn, controller.getPurchases)
    router.post('/purchases', isLoggedIn, controller.postPurchases)
    router.get('/purchases/add', isLoggedIn, controller.getAddPurchases)
    router.get('/purchases/edit/:invoice', isLoggedIn, controller.getEditPurchases)
    router.get('/purchases/delete/:invoice', isLoggedIn, controller.deletePurchases)

    app.use('/', router)
    return router;
}
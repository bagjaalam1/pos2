const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/sales.controller')

    router.get('/sales', isLoggedIn, controller.getSales)
    router.post('/sales', isLoggedIn, controller.postSales)
    router.get('/sales/add', isLoggedIn, controller.getAddSales)
    router.get('/sales/edit/:invoice', isLoggedIn, controller.getEditSales)
    router.get('/sales/delete/:invoice', isLoggedIn, controller.deleteSales)

    app.use('/', router)
    return router;
}
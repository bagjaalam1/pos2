const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/sales.controller')

    router.get('/sales/add', isLoggedIn, controller.getAPIAddSales)
    router.put('/sales/add', isLoggedIn, controller.putAPIAddSales)
    router.post('/sales/add', isLoggedIn, controller.postAPIAddSales)
    router.get('/sales/edit/:invoice', isLoggedIn, controller.getAPIEditSales)
    router.delete('/sales/edit/delete/:id', isLoggedIn, controller.deleteAPIEditSales)

    app.use('/api', router)
    return router;
}
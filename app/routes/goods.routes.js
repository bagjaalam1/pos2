const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/goods.controller')

    router.get('/goods', isLoggedIn, controller.getGoods)
    router.get('/goods/add', isLoggedIn, controller.getAddGood)
    router.post('/goods/add', isLoggedIn, controller.addGood)
    router.get('/goods/edit/:barcode', isLoggedIn, controller.getEditGoods)
    router.post('/goods/edit/:barcode', isLoggedIn, controller.editGoods)
    router.get('/goods/delete/:barcode', isLoggedIn, controller.deleteGoods)

    app.use('/', router)
    return router;
}
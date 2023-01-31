const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/goods.controller')

    router.get('/goods', isLoggedIn, controller.getGoods)
    router.get('/goods/add', isLoggedIn, controller.getAddGood)
    router.post('/goods/add', isLoggedIn, controller.addGood)

    app.use('/', router)
    return router;
}
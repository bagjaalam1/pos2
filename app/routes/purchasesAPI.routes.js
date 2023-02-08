const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/purchases.controller')

    router.get('/purchases/add', isLoggedIn, controller.getAPIAddPurchases)
    router.put('/purchases/add', isLoggedIn, controller.putAPIAddPurchases)
    router.post('/purchases/add', isLoggedIn, controller.postAPIAddPurchases)
    router.get('/purchases/edit/:invoice', isLoggedIn, controller.getAPIEditPurchases)
    router.delete('/purchases/edit/delete/:id', isLoggedIn, controller.deleteAPIEditPurchases)

    app.use('/api', router)
    return router;
}
const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/suppliers.controller')

    router.get('/suppliers', isLoggedIn, controller.getSuppliers)
    router.get('/suppliers/add', isLoggedIn, controller.getAddSupplier)
    router.post('/suppliers/add', isLoggedIn, controller.addSupplier)
    router.get('/suppliers/edit/:supplierid', isLoggedIn, controller.getEditSupplier)
    router.post('/suppliers/edit/:supplierid', isLoggedIn, controller.editSupplier)
    router.get('/suppliers/delete/:supplierid', isLoggedIn, controller.deleteSupplier)
    
    app.use('/', router)
    return router;
}
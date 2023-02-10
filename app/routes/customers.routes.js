const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/customers.controller')

    router.get('/customers', isLoggedIn, controller.getCustomers)
    router.get('/customers/add', isLoggedIn, controller.getAddCustomers)
    router.post('/customers/add', isLoggedIn, controller.addCustomers)
    router.get('/customers/edit/:customerid', isLoggedIn, controller.getEditCustomer)
    router.post('/customers/edit/:customerid', isLoggedIn, controller.editCustomer)
    router.get('/customers/delete/:customerid', isLoggedIn, controller.deleteCustomer)
    

    app.use('/', router)
    return router;
}
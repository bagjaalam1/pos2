const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/units.controller')

    router.get('/units', isLoggedIn, controller.getUnits)
    router.get('/units/add', isLoggedIn, controller.getAddUnit)
    router.post('/units/add', isLoggedIn, controller.addUnit)
    router.get('/units/edit/:unit', isLoggedIn, controller.getEditUnit)
    router.post('/units/edit/:unit', isLoggedIn, controller.editUnit)
    router.get('/units/delete/:unit', isLoggedIn, controller.deleteUnit)

    app.use('/', router)
    return router;
}
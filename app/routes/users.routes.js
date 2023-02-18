const { isLoggedIn } = require('../../helpers/util');

module.exports = (app) => {
    const router = require('express').Router();
    const controller = require('../controllers/users.controller')

    router.get('/login', controller.getLogin)
    router.post('/login', controller.login)
    router.get('/register', controller.getRegister)
    router.post('/register', controller.register)
    router.get('/logout', controller.logout)
    router.get('/users', isLoggedIn, controller.users)
    router.get('/users/add', isLoggedIn, controller.getAddUser)
    router.post('/users/add', isLoggedIn, controller.addUser)
    router.get('/users/edit/:userid', isLoggedIn, controller.getEditUser)
    router.post('/users/edit/:userid', isLoggedIn, controller.editUser)
    router.get('/users/delete/:userid', isLoggedIn, controller.deleteUser)
    router.get('/users/profile', isLoggedIn, controller.getProfile)
    router.post('/users/profile', isLoggedIn, controller.postProfile)
    router.get('/users/changepassword', isLoggedIn, controller.getChangepassword)
    router.post('/users/changepassword', isLoggedIn, controller.postChangepassword)

    app.use('/', router)
    return router;
}
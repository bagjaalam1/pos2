module.exports = (app) => {
    const router = require('express').Router();

    router.get('/', (req, res) => {
        res.render('login')
    })

    router.post('/', (req, res) => {
        res.render('login')
    })

    app.use('/login', router)
    return router;
}
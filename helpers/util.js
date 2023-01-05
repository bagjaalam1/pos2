module.exports = {
    isLoggedIn: async (req, res, next) => {
        try {
            if (req.session && req.session.user) {
                next() //callback
            } else {
                res.redirect('/login')
            }           
        } catch (error) {
            res.send(error)
        }

    }
}
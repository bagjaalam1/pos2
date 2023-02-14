var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')
var flash = require('connect-flash');
var fileUpload = require('express-fileupload')

var app = express();

app.use(fileUpload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'rubicamp',
  resave: false,
  saveUninitialized: true,
}))

app.use(flash());

require('./app/routes/users.routes')(app)
require('./app/routes/units.routes')(app)
require('./app/routes/goods.routes')(app)
require('./app/routes/suppliers.routes')(app)
require('./app/routes/purchases.routes')(app)
require('./app/routes/purchasesAPI.routes')(app)
require('./app/routes/customers.routes')(app)
require('./app/routes/sales.routes')(app)
require('./app/routes/salesAPI.routes')(app)
require('./app/routes/dashboard.routes')(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

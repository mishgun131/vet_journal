'use strict';

const express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    pgSession = require('connect-pg-simple')(session),
    pg = require('pg'),
    conf = new require('./settings')(),
    app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

/* -- Sessions -- */
const pool = new pg.Pool({
    user: conf.postgres.user,
    host: conf.postgres.host,
    database: conf.postgres.database,
    password: conf.postgres.password,
    port: conf.postgres.port
});

app.use(session({
    store: new pgSession({
        pool : pool
    }),
    secret: conf.cookieSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } //1 день
}));

/* -- STATIC ROUTES TO MODULES -- */
//angular route
app.use('/angular/js', express.static(__dirname + '/node_modules/angular/'));

//jquery route
app.use('/jquery/js', express.static(__dirname + '/node_modules/jquery/dist/'));

//datetime picker route
app.use('/datetimepicker/js', express.static(__dirname + '/node_modules/pc-bootstrap4-datetimepicker/build/js/'));
app.use('/datetimepicker/css', express.static(__dirname + '/node_modules/pc-bootstrap4-datetimepicker/build/css/'));

//datatables route
app.use('/datatables/js', express.static(__dirname + '/node_modules/datatables/media/js/'));
app.use('/datatables/css', express.static(__dirname + '/node_modules/datatables/media/css/'));
app.use('/datatables/images', express.static(__dirname + '/node_modules/datatables/media/images/'));

//moment.js route
app.use('/moment/js', express.static(__dirname + '/node_modules/moment/min/'));

//fontawesome route
app.use('/fontawesome/css', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/css/'));
app.use('/fontawesome/webfonts', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/webfonts/'));

//bootstrap route
app.use('/bootstrap/js', express.static(__dirname + '/node_modules/bootstrap/dist/js/'));
app.use('/bootstrap/css', express.static(__dirname + '/node_modules/bootstrap/dist/css/'));

//chart.js route
app.use('/chart/js', express.static(__dirname + '/node_modules/chart.js/dist/'));

//popper.js route
app.use('/popper/js', express.static(__dirname + '/node_modules/popper.js/dist/umd/'));

//jquery.typeahead route
app.use('/typeahead/js', express.static(__dirname + '/node_modules/jquery-typeahead/dist/'));
app.use('/typeahead/css', express.static(__dirname + '/node_modules/jquery-typeahead/dist/'));

//jquery-mask-plugin
app.use('/jquery-mask-plugin/js', express.static(__dirname + '/node_modules/jquery-mask-plugin/dist/'));

//noty
app.use('/noty/js', express.static(__dirname + '/node_modules/noty/lib/'));
app.use('/noty/css', express.static(__dirname + '/node_modules/noty/lib/'));

app.use(express.static(path.join(__dirname, 'public')));

/* -- ROUTES -- */
const index = require('./routes/index');
app.use('/', index);

const users = require('./routes/users');
app.use('/users', users);

const auth = require('./routes/auth');
app.use('/auth', auth);

const clients = require('./routes/clients');
app.use('/clients', clients);

const dicts = require('./routes/dicts');
app.use('/dicts', dicts);

//api
const api = require('./routes/api');
app.use('/api', api);

app.use(logger('dev'));

//Заполним кэш приложения
const cache = require('./libs/cache');
cache.updateCache();

// ToDo сделать нормальную 404
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// ToDo сделать нормальную 500
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

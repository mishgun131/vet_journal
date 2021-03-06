'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../db/db');

router.get('/', function(req, res, next) {
    res.render('auth');
});

router.post('/', function(req, res, next) {
    if (req.body && req.body.login && req.body.password) {
        let login = req.body.login,
            password = req.body.password;

        db.login(login, password, function(err, result) {
            if (err || !result) {
                res.send({success: false, err: err});
            } else {
                req.session.user = login;
                res.send({success: true});
            }
        });
    } else {
        res.send({success: false});
    }
});

module.exports = router;
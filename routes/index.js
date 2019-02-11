'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../db/db');

router.get('/', db.checkUser, function(req, res, next) {
    res.render('index');
});

router.post('/logout/', db.checkUser, function(req, res, next) {
    req.session.destroy();
    res.send();
});

module.exports = router;

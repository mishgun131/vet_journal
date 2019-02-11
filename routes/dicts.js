'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../db/db'),
    cache = require('../libs/cache'),
    _ = require('../libs/_utils');

router.get('/drugs', db.checkUser, function(req, res, next) {
    let _module = 'dicts.drugs';

    res.render('dicts_drugs');
});

module.exports = router;
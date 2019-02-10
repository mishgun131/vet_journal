var express = require('express');
var router = express.Router();
var db = require('../db/db');

router.get('/', db.checkUser, function(req, res, next) {
  res.render('index');
});

router.post('/logout/', db.checkUser, function(req, res, next) {
  req.session.destroy();
  res.send();
});

module.exports = router;

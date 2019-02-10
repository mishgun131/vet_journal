const express = require('express'),
    router = express.Router(),
    db = require('../db/db'),
    cache = require('../libs/cache'),
    _ = require('../libs/_utils');

router.get('/', db.checkUser, function(req, res, next) {
    let _module = 'clients.init';

    res.render('clients', {clients: []});
});

router.get('/client_:id(\\d+)/', db.checkUser, function(req, res, next) {
    let id = req.params.id,
        _module = 'clients.getClient';

    db.getClient(id, function (err, client) {
        if (err) {
            res.status(500);
            res.render('error', {
                message: 'Внутренняя ошибка сервера',
                error: err
            });
            return;
        }

        db.getPetsList(id, null, function (err, pets) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            _.log('debug', _module, 'Данные', client, pets, cache.event_types);

            res.render('client', {client_info: client, pets: pets, event_types: cache.event_types});
        });
    });
});

module.exports = router;

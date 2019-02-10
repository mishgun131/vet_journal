const express = require('express'),
    router = express.Router(),
    db = require('../db/db'),
    _ = require('../libs/_utils');

/*----------------------*/
/*      GET методы      */
/*----------------------*/
router.get('/search', db.checkUser, function(req, res) {
    let _module = 'api.search';

    if (req.query && req.query.q != null) {
        db.liveSearchClient(req.query.q, function (err, result) {
            if (err) {
                res.send({"status": false, "error": err, "data": {"client": []}});
                return;
            }

            res.send({"status": true, "data": {"client": result}});
        });
    } else {
        _.log('error', _module, 'Query is empty', {query: req.query});
        res.send({"status": false, "error": _.stdFrontErrMessage, "data": {"client": []}});
    }
});

router.get('/get_pet_types', db.checkUser, function(req, res) {
    let _module = 'api.get_pet_types';

    db.getPetTypes(function(err, pet_types) {
        if (err) {
            res.send({"status": false, "error": err, "data": {"pet_types": []}});
            return;
        }

        res.send({"status": true, "data": {"pet_types": pet_types}});
    });
});

router.get('/get_pet_breeds_by_type_id', db.checkUser, function(req, res) {
    let _module = 'api.get_pet_breeds_by_type_id';

    if (req.query && req.query.id != null) {
        db.getPetBreedsByTypeId(req.query.id, function(err, pet_breeds) {
            if (err) {
                res.send({"status": false, "error": err, "data": {"pet_breeds": []}});
                return;
            }

            res.send({"status": true, "data": {"pet_breeds": pet_breeds}});
        });
    } else {
        _.log('error', _module, 'Query is empty', {query: req.query});
        res.send({"status": false, "error": _.stdFrontErrMessage, "data": {"pet_breeds": []}});
    }
});

//Получение списка клиентов для таблицы Список клиентов
router.get('/get_client_list', db.checkUser, function(req, res) {
    let _module = 'api.get_client_list';

    db.getClientList(function(err, clients) {
        if (err) {
            res.send({error: err, data: []});
            return;
        }

        res.send({data: clients});
    });
});

//Получение списка препаратов для таблицы Список препаратов
router.get('/get_grugs_list', db.checkUser, function(req, res) {
    let _module = 'api.get_grugs_list';

    db.getDrugList(function(err, clients) {
        if (err) {
            res.send({error: err, data: []});
            return;
        }

        res.send({data: clients});
    });
});

/*----------------------*/
/*     POST методы      */
/*----------------------*/

router.post('/addClient/', db.checkUser, function(req, res) {
    let _module = 'api.addClient';

    if (req && req.body) {
        _.log('debug', _module, 'Входные параметры', {body: req.body, pets: req.body.pets});

        let client = req.body;

        db.addClient(client, function (err, id) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true, id: id});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', {body: req.body});
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

//Редактирование поля клиента по имени поля и по идентификатору клиента
router.post('/editClient/', db.checkUser, function(req, res, next) {
    let _module = 'api.editClient';

    if (req && req.body) {
        let client_id = req.body.id,
            field = req.body.field,
            value = req.body.value;

        db.editClient(client_id, field, value, function (err) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', req);
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

router.post('/addPet/', db.checkUser, function(req, res) {
    let _module = 'api.addPet';

    if (req && req.body) {
        _.log('debug', _module, 'Входные параметры', req.body);

        let pet = req.body;

        db.addPet(pet, function (err, pet) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true, pet: pet});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', req);
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

//Получение списка питомцев со всем набором полей по id клиента
router.post('/getPetsList/', db.checkUser, function(req, res, next) {
    let _module = 'api.getPetsList';

    if (req && req.body) {
        let client_id = req.body.id;

        db.getPetsList(client_id, null, function (err, rows) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            _.log('debug', _module, 'pets', {rows: rows});

            res.send({success: true, result: rows});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', {body: req.body});
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

//Редактирование поля клиента по имени поля и по идентификатору клиента
router.post('/editPet/', db.checkUser, function(req, res, next) {
    let _module = 'api.getPetsList';

    if (req && req.body) {
        let pet_id = req.body.id,
            field = req.body.field,
            value = req.body.value;

        db.editPet(pet_id, field, value, function (err, data) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true, data: data});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', {body: req.body});
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

//Получение истории изменения веса питомца
router.post('/getPetWeightHistory/', db.checkUser, function(req, res, next) {
    let _module = 'api.getPetWeightHistory';

    if (req && req.body) {
        let pet_id = req.body.pet_id;

        db.getPetWeightHistory(pet_id, function (err, data) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true, data: data});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', {body: req.body});
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

//Получение истории изменения веса питомца
router.post('/addDrug/', db.checkUser, function(req, res, next) {
    let _module = 'api.addDrug';

    if (req && req.body) {
        let drug = req.body;

        db.addDrug(drug, function (err, drug) {
            if (err) {
                res.send({success: false, err: err});
                return;
            }

            res.send({success: true, drug: drug});
        });
    } else {
        _.log('error', _module, 'Куда-то делось body', {body: req.body});
        res.send({success: false, err: _.stdFrontErrMessage});
    }
});

module.exports = router;
'use strict';

const query = require('pg-query'),
    conf = new require('../settings')(),
    _ = require('../libs/_utils');

const db = function (connectParams) {
    let _connectParams;

    if (connectParams) {
        _connectParams = connectParams;
    } else {
        _connectParams = conf.connectString;
    }

    _.log('debug', 'db.init', 'Параметры подключения', {_connectParams: _connectParams});

    query.connectionParameters = _connectParams;
};

db.prototype.login = function (login, password, cb) {
    let params, sql,
        _module = 'db.login';

    if (login && login.length
        && password && password.length) {

        sql = 'select result_id, user_id from control.login($1,' + //login text not null
        '$2);'; //password text not null

        params = [login, password];

        query(sql, params, function(err, rows) {
            if (err) {
                _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
                cb(_.stdFrontErrMessage, false);
            } else {
                if (rows && rows.length) {
                    if (rows[0].result_id > 0) { //Код больше нуля, значит ошибка входа 1 - пользователь не найден, 2 - пароль не верный
                        _.log('debug', _module, 'Неудачная попытка авторизации', {login: login, password: password, rows: rows});
                        cb('Логин или пароль не верные', false);
                    } else {
                        cb(null, true);
                    }
                } else {
                    _.log('error', _module, 'Пустой ответ сервера', {rows: rows});
                    cb(_.stdFrontErrMessage, false);
                }
            }
        });
    } else {
        cb('Логин или пароль пустые', false);
    }
};

db.prototype.checkUser = function(req, res, next) {
    let originalUrl = null,
        _module = 'db.checkUser';

    if (req.originalUrl && req.originalUrl !== '/') {
        originalUrl = encodeURIComponent(req.originalUrl);
    }

    if (req.session && req.session.user) {
        let params, sql = 'select control.checkUser($1) as check;';

        params = [req.session.user];

        query(sql, params, function(err, rows) {
            if (err) {
                _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
                res.redirect('/auth');
            } else {
                if (rows && rows.length) {
                    var cnt = rows[0]['cnt'];
                    if (rows[0].check === 0) { //Успешно
                        next();
                    } else { //Не успешно
                        _.log('debug', _module, 'Неудачная проверка сессии', {login: req.session.user, rows: rows});
                        if (originalUrl) {
                            res.redirect('/auth?originalUrl=' + originalUrl);
                        } else {
                            res.redirect('/auth');
                        }
                    }
                } else {
                    _.log('error', _module, 'Пустой ответ сервера', {rows: rows});
                    if (originalUrl) {
                        res.redirect('/auth?originalUrl=' + originalUrl);
                    } else {
                        res.redirect('/auth');
                    }
                }
            }
        });
    } else {
        _.log('debug', _module, 'Не авторизованный пользователь', req.session);
        if (originalUrl) {
            res.redirect('/auth?originalUrl=' + originalUrl);
        } else {
            res.redirect('/auth');
        }
    }
};

db.prototype.addClient = function(client, cb) {
    let params, sql,
        _module = 'db.addClient';

    if (!client.firstname || !client.lastname || !client.phone) {
        _.log('debug', _module, 'Ошибка: не заполнено обязательное поле', {client: client});
        cb('Ошибка: не заполнено обязательное поле');
        return;
    }

    sql = 'select control.cl_add_client($1,' + //firstName text not null
    '$2,' + //lastName text not null
    '$3,' + //middleName text null
    '$4,' + //address text null
    '$5,' + //phone text not null
    '$6,' + //cl_comment text null
    '$7) as cl_id;'; //pets array[jsonb] not null

    params = [];

    params.push(client.firstname); //$1
    params.push(client.lastname); //$2
    params.push((client.middlename && client.middlename.length)? client.middlename : null); //$3
    params.push((client.address && client.address.length)? client.address : null); //$4
    params.push(client.phone); //$5
    params.push((client.cl_comment && client.cl_comment.length)? client.cl_comment : null); //$6
    params.push(client.pets); //$7

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            var id = rows[0].cl_id;
            cb(null, id);
        }
    });
};

db.prototype.editClient = function(client_id, field, value, cb) {
    let params, sql,
        _module = 'db.editClient';

    sql = 'select control.cl_edit_field_value($1,' + //client_id integer not null
    '$2,' + //field text not null
    '$3);'; //value text not null

    params = [client_id, field, value];

    query(sql, params, function(err) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null);
        }
    });
};

db.prototype.getClientList = function(cb) {
    let sql,
        _module = 'db.getClientList';

    sql = 'select * from control.cl_get_clients_list();';

    query(sql, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: sql});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

db.prototype.getClient = function(id, cb) {
    let params, sql,
        _module = 'db.getClient';

    sql = 'select * from control.cl_get_client_by_id($1);'; //client_id integer not null

    params = [id];

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows[0]);
        }
    });
};

db.prototype.addPet = function(pet, cb) {
    let params, sql,
        _module = 'db.addPet';

    if (!pet.client_id || !pet.nickname || !pet.type || !pet.birthday) {
        _.log('debug', _module, 'Ошибка: не заполнено обязательное поле', {pet: pet});
        cb('Ошибка: не заполнено обязательное поле');
        return;
    }

    sql = 'select control.pt_add_pet($1,' + //cl_id$i integer not null
    '$2,' + //nickname$t text not null
    '$3,' + //sex_id$i integer not null
    '$4,' + //type$t text not null
    '$5,' + //breed$t text null
    '$6,' + //weight$n numeric null
    '$7,' + //birthday$t text not null
    '$8) as pt_id;'; //birthday_is_exact$b boolean not null

    params = [];

    params.push(pet.client_id); //$1
    params.push(pet.nickname); //$2
    params.push(pet.sex_id); //$3
    params.push(pet.type); //$4
    params.push((pet.breed && pet.breed.length)? pet.breed : null); //$5
    params.push(pet.weight); //$6
    params.push(pet.birthday); //$7
    params.push(pet.birthday_is_exact); //$8

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', err, _.getSql(sql, params));
            cb(_.stdFrontErrMessage);
        } else {
            sql = 'select * from control.pt_get_pet_list($1,$2);'; //client_id integer not null or pet_id not null

            params = [null, rows[0].pt_id];

            query(sql, params, function(err, rows) {
                if (err) {
                    _.log('error', _module, 'Ошибка запроса', err, _.getSql(sql, params));
                    cb(_.stdFrontErrMessage);
                } else {
                    cb(null, rows[0]);
                }
            });
        }
    });
};

db.prototype.getPetsList = function(client_id, pet_id, cb) {
    let params, sql,
        _module = 'db.getPetsList';

    if (client_id && pet_id) {
        _.log('error', _module, 'Одно из передаваемых параметров должно быть пустое', client_id, pet_id);
        cb(_.stdFrontErrMessage);
        return;
    }

    sql = 'select * from control.pt_get_pet_list($1,$2);'; //client_id integer not null or pet_id not null

    params = [client_id, pet_id];

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

db.prototype.editPet = function(pet_id, field, value, cb) {
    let params, sql,
        _module = 'db.editPet';

    sql = 'select control.pt_edit_field_value($1,' + //pet_id integer not null
    '$2,' + //field text not null
    '$3);'; //value text not null

    params = [pet_id, field, value];

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            let data = null;

            if (rows && rows[0]) {
                data = rows[0]['pt_edit_field_value'];
            }

            cb(null, data);
        }
    });
};

db.prototype.getPetWeightHistory = function(pet_id, cb) {
    let params, sql,
        _module = 'db.getPetWeightHistory';

    sql = 'select * from control.pt_get_weight_history($1);'; //pet_id integer not null

    params = [pet_id];

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

db.prototype.liveSearchClient = function(query_string, cb) {
    let _module = 'db.liveSearchClient';

    let params, sql = 'select * from control.cl_search_clients($1);'; //query$t text not null

    query_string = query_string.split(' ');

    params = [];
    params[0] = [];
    for (let i = 0; i < query_string.length; i++) {
        if (query_string[i] && query_string[i].length) {
            params[0].push(query_string[i]);
        }
    }

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

db.prototype.getPetTypes = function(cb) {
    let _module = 'db.getPetTypes';

    let sql = 'select * from control.pt_get_pet_types();'; //query$t text not null

    query(sql, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: sql});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

db.prototype.getPetBreedsByTypeId = function(type_id, cb) {
    let _module = 'db.getPetBreedsByTypeId';

    let params = [type_id]
        ,sql = 'select * from control.pt_get_pet_breeds_by_type_id($1);';

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

//Получение всех типов записей
db.prototype.getEventTypes = function(cb) {
    let _module = 'db.getEventTypes';

    let sql = 'select * from control.ev_get_types();';

    query(sql, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', err, sql);
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

//Добавление нового препарата
db.prototype.addDrug = function(drug, cb) {
    let params, sql,
        _module = 'db.addDrug';

    if (!drug.name) {
        _.log('error', _module, 'Ошибка: не заполнено обязательное поле', {drug: drug});
        cb('Ошибка: не заполнено обязательное поле');
        return;
    }

    sql = 'select control.dict_add_drug($1,' + //name$t text not null
        '$2,' + //realese_form$t text null
        '$3);'; //price$n numeric null

    params = [];

    params.push(drug.name); //$1
    params.push(drug.release_form? drug.release_form : null); //$2
    params.push(drug.price? drug.price : null); //$3

    query(sql, params, function(err) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', err, _.getSql(sql, params));
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, drug);
        }
    });
};

//Получение списка препаратов
db.prototype.getDrugList = function(cb) {
    let sql,
        _module = 'db.getDrugList';

    sql = 'select * from control.dict_get_drugs_list();'; //price$n numeric null

    query(sql, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', err, sql);
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

//Просто выполнить запрос в базе.
db.prototype.execQuery = function(sql, params, cb) {
    let _module = 'db.execQuery';

    query(sql, params, function(err, rows) {
        if (err) {
            _.log('error', _module, 'Ошибка запроса', {err: err, sql: _.getSql(sql, params)});
            cb(_.stdFrontErrMessage);
        } else {
            cb(null, rows);
        }
    });
};

module.exports = new db();
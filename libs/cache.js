'use strict';

const conf = new require('../settings')(),
    db = require('../db/db'),
    async = require('async'),
    _ = require('../libs/_utils');

const cache = function () {
    //Заполним кэш
    //this.updateCache();
};

//Собственно сам кэш
//Типы записей питомцев
cache.prototype.event_types = {};

cache.prototype.updateCache = async function() {
    let _module = 'cache.updateCache';

    this.event_types = await this.getEventTypes();

    _.log('log', _module, 'Кэш обновлен');
};

cache.prototype.getEventTypes = function() {
    let _module = 'cache.getEventTypes';

    return new Promise(function(resolve) {
        db.getEventTypes(function (err, event_types) {
            if (err) {
                resolve();
                return;
            }

            _.log('debug', _module, 'Типы записей', event_types);

            resolve(event_types);
        });
    });
};

module.exports = new cache();
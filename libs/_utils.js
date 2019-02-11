'use strict';

let conf = new require('../settings')();

//Набор всяких утилит
Date.prototype.yyyymmdd = function() {
    let mm = this.getMonth() + 1,
        dd = this.getDate(),
        hh = this.getHours(),
        mi = this.getMinutes(),
        ss = this.getSeconds();

    return this.getFullYear() +
        "-" + ((mm < 10)? "0" + mm : mm) +
        "-" + ((dd < 10)? "0" + dd : dd) +
        " " + ((hh < 10)? "0" + hh : hh) +
        ":" + ((mi < 10)? "0" + mi : mi) +
        ":" + ((ss < 10)? "0" + ss : ss);
};

let _utils = {
    stdFrontErrMessage: 'Произошла ошибка на стороне сервера, подробности смотрите в логах.',
    //Склеивает sql и набор параметров в sql
    getSql: function(sql, params) {
        let result = '';

        if (sql && params && params.length) {
            for (let i = 0; i < params.length; i++) {
                sql = sql.replace('$' + (i + 1), (params[i] != null)? "'" + params[i] + "'" : 'null');
            }

            result = sql;
        }

        return result;
    },

    //Логирование. Маска (Разделяется табуляцией): YYYY-MM-DD 24HH:MI:SS  MODULE.FUNCTION MESSAGE
    log: function(level, module, message, additional) {
        let time = (new Date()).yyyymmdd(),
            args = [].slice.apply(arguments),
            log = [];

        if (['error', 'debug', 'log'].indexOf(args[0]) === -1) {
            level = 'log';
            module = 'none.none';
            message = args.shift();
        } else {
            level = args.shift();
            module = args.shift();
            message = args.shift();
        }

        for (let i = 0; i < args.length; i++) {
            log.push('\r\n Параметр ' + (i + 1) + ':\r\n');
            log.push(args[i]);
        }

        log.unshift(time + '\t' + module + '\t' + level.toUpperCase() + ':\t' + message.replace(/\t/g, ' '));

        switch (level) {
            case 'error':
                console.error.apply(console, log);
                break;
            case 'debug':
                if (conf.debug) {
                    console.log.apply(console, log);
                }
                break;
            case 'log':
                console.log.apply(console, log);
                break;
        }
    }
};

module.exports = _utils;
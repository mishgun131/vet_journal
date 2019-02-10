var async = require('async'),
    db = require('../db/db'),
    _ = require('../libs/_utils');

var _obj = {
    gen: function() {
        var objArray = [];

        for (var i = 0; i < 10000; i++) {
            var objClient = {};

            objClient.firstname = _obj.genString(6, 12);
            objClient.lastname = _obj.genString(6, 12);
            objClient.middlename = _obj.genString(6, 12);
            objClient.address = _obj.genString(14, 20);
            objClient.phone = '(' + _obj.genNumber(3) + ') ' + _obj.genNumber(7);
            objClient.cl_comment = _obj.genString(40, 60);
            objClient.pet = [{nickname: _obj.genString(4, 8), sex_id: 1, type: 'Собака', birthday: '01.01.2017', birthday_is_exact: true},
                {nickname: _obj.genString(4, 8), sex_id: 0, type: 'Кот', birthday: '01.02.2017', birthday_is_exact: true}];

            objArray.push(objClient);
        }

        async.eachLimit(objArray, 10, function(obj, cb) {
            db.execQuery('select control.cl_add_client($1,$2,$3,$4,$5,$6,$7);', [obj.firstname, obj.lastname, obj.middlename, obj.address, obj.phone, obj.cl_comment, obj.pet], function() {
                cb();
            });
        }, function() {
            _.log('log', 'gen', 'complete');
        });
    },

    genString: function(lenmax, lenmin) {
        var text = "", len = Math.floor(Math.random() * lenmax) + lenmin;
        var possible = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

        possible = possible + possible.toUpperCase();

        for (var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    genNumber: function(len) {
        var text = "";
        var possible = "0123456789";

        for (var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
};

module.exports = _obj;
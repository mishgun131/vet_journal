const vetApplication = angular.module('vet_clinic_app', []), __global = {};

vetApplication.controller('authController', function($scope, $http) {
    $scope.submit = function() {
        $http.post('auth', $scope.authForm)
            .success(function (data) {
                if (!data.success) {
                    new Noty({
                        text: data.err,
                        type: 'error'
                    }).show();
                } else {
                    __global.originalUrl? window.location = __global.originalUrl : window.location = '/';
                }
            });
    };
});

__global.getOriginalUrl = function (val) {
    let result = null,
        tmp = [];

    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        });

    return result;
};

/*  init block  */
$(document).ready(function() {
    /*  noty init  */
    Noty.overrideDefaults({
        layout: 'bottomRight',
        theme: 'relax',
        type: 'error',
        text: '',
        dismissQueue: true,
        template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
        animation: {
            open: 'animated flipInX',
            close: 'animated flipOutX',
            easing: 'swing',
            speed: 300
        },
        timeout: 4000,
        force: false,
        modal: false,
        maxVisible: 5,
        killer: false,
        closeWith: ['click'],
        callback: {
            onShow: function() {},
            afterShow: function() {},
            onClose: function() {},
            afterClose: function() {},
            onCloseClick: function() {}
        },
        buttons: false
    });
    /*  !noty init  */

    __global.originalUrl = __global.getOriginalUrl('originalUrl');
});
/*  !init block  */
vetApplication.controller('indexController', function($scope, $http) {
    $scope.pets = [{id: '0'}];
});

/*  init block  */
$(document).ready(function() {
    /*  navBar active link  */
    $('.nav a:contains("Главная")').parent().addClass('active');
    /*  !navBar active link  */
});
/*  !init block  */

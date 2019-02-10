vetApplication.controller('dict-drugs-controller', function($scope, $http) {
    $scope.init = function() {
        console.log('Init error');
    };
});

vetApplication.controller('modal-add-drug', function($scope, $http) {
    //Добавление нового питомца
    $scope.addDrugData = {};

    $scope.addDrugSubmit = function() {
        let modal = document.querySelector('#add-drug-modal');

        console.log($scope.addDrugData);
        //Отправляем, то, что получилось на сьедение базе
        $http.post('/api/addDrug', $scope.addDrugData)
            .success(function (data) {
                if (data.success) {
                    $scope.addDrug.$setPristine();
                    $scope.addDrug.$setUntouched();
                    $scope.addDrugData = {};

                    noty({
                        type: 'success',
                        text: 'Препарат добавлен.'
                    });

                    $(modal).modal('hide');
                } else {
                    noty({text: 'Ошибка: ' + data.err});
                }
            });
    };
});

/*  init block  */
$(document).ready(function() {
    /*  drugs table */
    $('#drugs-table').DataTable({
        'bAutoWidth': false,
        'ajax': '/api/get_grugs_list',
        'columns': [
            {'data': 'name', 'sWidth': '60%',
                'render': function (data, type, row) {
                    return '<a href="/dicts/drugs/drug_' + row.id + '">' + data + '</a>';
                }},
            {'data': 'release_form', 'sWidth': '20%'},
            {'data': 'price', 'sWidth': '20%'}
        ],
        'language': {
            'info': 'Показано от _START_ до _END_ записи. Всего _TOTAL_ записей.',
            'search': 'Поиск: ',
            'paginate': {
                'previous': 'Назад',
                'next': 'Вперед'
            },
            'lengthMenu': 'Показывать _MENU_ записей'
        },
        'pageLength': 30,
        'lengthMenu': [[30, 50, -1], [30, 50, "все"]]
    });
    /*  !drugs table */

    /*  navBar active link  */
    $('.nav a#dict-drugs').parent().addClass('active');
});

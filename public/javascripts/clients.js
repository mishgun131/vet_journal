vetApplication.controller('clients-controller', function($scope, $http, $location) {

});

/*  init block  */
$(document).ready(function() {
    /*  clients table */
    $('#clients-table').DataTable({
        'bAutoWidth': false,
        'ajax': '/api/get_client_list',
        'columns': [
            {'data': 'fio', 'sWidth': '40%',
                'render': function (data, type, row) {
                    return '<a href="/clients/client_' + row.id + '">' + data + '</a>';
                }},
            {'data': 'phones', 'sWidth': '15%'},
            {'data': 'phonesclean', 'sWidth': '0%', 'visible': false, 'searchable': true},
            {'data': 'pets', 'sWidth': '45%'}
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
    /*  !clients table */

    /*  navBar active link  */
    $('.nav a#clients').parent().addClass('active');
    /*  !navBar active link  */
});
/*  !init block  */

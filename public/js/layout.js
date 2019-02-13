let vetApplication = angular.module('vet_clinic_app', [])
    .directive('petsRepeatDirective', function() {
        return function(scope) {
            if (scope.$last) {
                let list = document.querySelectorAll('.new-cl-pet-block'),
                    index = list.length - 1,
                    petElem = list[index],
                    typeInput = $(petElem.querySelector('.pet-type-live-search')),
                    breedInput = $(petElem.querySelector('.pet-breed-live-search'));

                let typehead_pet_type = _vet_configs.typehead_pet_type;

                typehead_pet_type.callback = {
                    onClick: function (node, a, item) {
                        //При динамическом добавлении живого поиска, старый не удаляется стандартными методами, приходится чистить руками
                        breedInput.parent().find('.typeahead__result').remove();

                        if (item.type_id != null) {
                            typeInput.val(item.pet_type).trigger('input');

                            let typehead_pet_breed = _vet_configs.typehead_pet_breed;

                            typehead_pet_breed.source.pet_breeds.ajax.url = '/api/get_pet_breeds_by_type_id?id=' + item.type_id;
                            typehead_pet_breed.callback = {
                                onClick: function (node, a, item) {
                                    breedInput.val(item.pet_breed).trigger('input');
                                }
                            };

                            breedInput.typeahead(typehead_pet_breed);
                        }
                    }
                };

                //Список типов питомцев и динамически подтягиваем список пород привязанных к выбранному типу
                typeInput.typeahead(typehead_pet_type);
            }
        };
    });

vetApplication.controller('add-new-cl-controller', function($scope, $http, $location) {
    $scope.addClientData = {};
    $scope.pets = [{id: '0'}];

    $scope.addClientSubmit = function() {
        $scope.addClientData.pets = [];

        //Костыль, запихиваем в массив список животных и обрезаем те, которые удалили в интерфейсе
        for (let k in $scope.addClientData.pet) {
            if (Number(k) < $scope.pets.length) {
                let pet = $scope.addClientData.pet[k];

                //Разберемся с датами, система хитрая(зачеркнуто) дурацкая, но мне показалось, что удобная для пользователя
                //Первое, если точно передан день рождения, то просто его сохраняем и помечаем что д.р. "точный"
                if (pet.birthday) {
                    pet.birthday_is_exact = true;
                } else if (pet.years || pet.months) { //Если передан только кол-во лет / месяцев, вычисляем дату рождения отрезанную до месяца
                    let birthday;
                    pet.months = (pet.months)? Number(pet.months) : 0;
                    pet.years = (pet.years)? Number(pet.years) : 0;

                    //Вычитаем из сегодня кол-во лет и месяцев и приводим в необходимый формат
                    birthday = moment().add(pet.years * -1, 'year').add(pet.months * -1, 'month').format('01.MM.YYYY');

                    pet.birthday = birthday;
                    pet.birthday_is_exact = false;
                }

                $scope.addClientData.pets.push(pet);
            }
        }

        delete $scope.addClientData.pet;

        //console.log($scope.addClientData);
        //Отправляем, то, что получилось на сьедение базе
        $http.post('/api/addClient', $scope.addClientData)
            .success(function (data) {
                if (data.success) {
                    $scope.addClient.$setPristine();
                    $scope.addClient.$setUntouched();
                    $scope.addClientData = {};
                    $scope.pets = [{id: '0'}];

                    angular.element('#collapse-button').trigger('click');

                    new Noty({
                        text: 'Клиент добавлен. Сейчас будет переход на его страницу.',
                        type: 'success',
                        timeout: 1000
                    }).show();

                    //Через секунду перейдем на страницу клиента
                    setTimeout(function() {
                        window.location = '/clients/client_' + data.id;
                    }, 1000);
                } else {
                    new Noty({
                        text: data.err,
                        type: 'error'
                    }).show();
                }
            });
    };

    $scope.addPet = function() {
        $scope.pets.push({'id': $scope.pets.length});
    };

    $scope.delPet = function() {
        $scope.pets.pop();
    };

    //Срабатывает при заполнении даты, высчитываем примерный возраст
    $scope.setAge = function(e) {
        let elem, petIndex, date, ageYearField, ageMonthField, now = moment(),
            years, months;

        elem = e.target;
        if (elem.value && elem.value.length) {
            petIndex = elem.getAttribute('data-index');
            date = moment(elem.value, 'DD.MM.YYYY');
            years = now.diff(date, 'years');
            months = now.diff(date, 'months');

            //Вычитаем полные года из кол-ва месяцев
            months = months - years * 12;

            ageYearField = document.querySelector('#new-cl-pet-age-year-' + petIndex);
            ageMonthField = document.querySelector('#new-cl-pet-age-month-' + petIndex);

            ageYearField.value = years;
            ageMonthField.value = months;
        }
    };

    //При заполнении лет автоматом проставим 0 в поле "мес"
    $scope.setAgeMonth = function(e) {
        let elem, petIndex, ageMonthField;

        elem = e.target;
        if (elem.value && elem.value.length) {
            petIndex = elem.getAttribute('data-index');

            ageMonthField = document.querySelector('#new-cl-pet-age-month-' + petIndex);

            if (ageMonthField
                && !ageMonthField.value) {
                ageMonthField.value = 0;
            }
        }
    };

    //При заполнении месяца автоматом проставим 0 в поле "лет"
    $scope.setAgeYear = function(e) {
        let elem, petIndex, ageYearField;

        elem = e.target;
        if (elem.value && elem.value.length) {
            petIndex = elem.getAttribute('data-index');

            ageYearField = document.querySelector('#new-cl-pet-age-year-' + petIndex);

            if (ageYearField
                && !ageYearField.value) {
                ageYearField.value = 0;
            }
        }
    };
});

vetApplication.directive('datepicker', function () {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, elem, attrs, ngModelCtrl) {
            if (!ngModelCtrl) return;

            let updateModel = function () {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(elem.val());
                });
            };

            elem.datetimepicker(_vet_configs.datepicker_config);

            elem.on('dp.change', function (e) {
                updateModel();
            });
        }
    }
});

window.onload = function() {
    $("#session-destroy").click(function() {
        $.post("/logout", function() {
            window.location = '/auth';
        });
    });

    /*  phones  */
    $("#new-cl-input-phonenumber").mask("(999) 9999999");
    /*  !phones  */

    /* 'live' search */
    //Поиск по клиентам и питомцам
    $.typeahead({
        input: '.live-search',
        minLength: 3,
        maxItem: 10,
        order: "asc",
        dynamic: true,
        delay: 200,
        backdrop: {
            "background-color": "#fff"
        },
        highlight: 'any',
        filter: false,
        cancelButton: false,
        template: function (query, item) {
            return '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">ФИО:</small> <span class="lastname">{{lastname}} {{firstname}}' + (item.middlename? ' {{middlename}}' : '') + '</span></h6>' +
                '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">Телефон:</small> 8 <span class="phone">{{phone}}</span><small class="text-muted">; Адрес:</small> <span class="address">{{address}}</span></h6>' +
                '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">Питомцы:</small> <span class="pets">{{pets}}</span></h6>';
        },
        emptyTemplate: '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">Нет результатов по запросу "</small>{{query}}<small class="text-muted">"</small></h6>',
        source: {
            client: {
                href: "/clients/client_{{id}}",
                ajax: function (query) {
                    return {
                        type: "GET",
                        url: "/api/search",
                        path: "data.client",
                        data: {
                            q: "{{query}}"
                        }
                    }
                }
            }
        },
        callback: {
            onClick: function (node, a, item) {
                return;
            }
        }
    });
    /* !'live' search */

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

    /* bootstrap tooltips */
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    /* Moment set locale */
    moment.locale('ru');
};

// Global variables for application
const _vet_configs = {
    typehead_pet_type: {
        minLength: 0,
        maxItem: 10,
        order: "asc",
        dynamic: false,
        backdrop: false,
        highlight: 'any',
        filter: true,
        display: ['pet_type'],
        cancelButton: false,
        searchOnFocus: true,
        template: '<h6 style = "margin-top:0; margin-bottom:0">{{pet_type}}</span></h6>',
        emptyTemplate: '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">Будет добавлен тип "</small>{{query}}<small class="text-muted">"</small></h6>',
        source: {
            pet_types: {
                ajax: {
                    url: '/api/get_pet_types',
                    path: 'data.pet_types'
                }
            }
        }
    },
    typehead_pet_breed: {
        minLength: 0,
        maxItem: 10,
        order: "asc",
        dynamic: false,
        backdrop: false,
        highlight: 'any',
        filter: true,
        display: ['pet_breed'],
        cancelButton: false,
        searchOnFocus: true,
        template: '<h6 style = "margin-top:0; margin-bottom:0">{{pet_breed}}</span></h6>',
        emptyTemplate: '<h6 style = "margin-top:0; margin-bottom:0"><small class="text-muted">Будет добавлена порода "</small>{{query}}<small class="text-muted">"</small></h6>',
        source: {
            pet_breeds: {
                ajax: {
                    //url: '/api/get_pet_breeds_by_type_id?id=' + item.type_id,
                    path: 'data.pet_breeds'
                }
            }
        }
    },
    datepicker_config: {
        locale: 'ru',
        format: 'DD.MM.YYYY',
        maxDate: moment()
    }
};
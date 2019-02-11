'use strict';

vetApplication.directive('petsListRepeatDirective', function() {
    return function(scope) {
        let list = document.querySelectorAll('.pets-list-repeat');

        if (list.length) {
            let index = list.length - 1;
            let petElem = list[index];

            if (petElem) {//Список типов питомцев
                let typehead_pet_type = _vet_configs.typehead_pet_type;

                $(petElem.querySelector('.pet-type-live-search')).typeahead(typehead_pet_type);
            }

            $(petElem.querySelector('.datepicker-input')).datetimepicker(_vet_configs.datepicker_config);

            setTimeout(function() {window['_client'].set_birthday_text(petElem)}, 0);
        }
    };
});

vetApplication.factory('Client', function() {
    let client = {};

    return {
        getClient: function () {
            return client;
        },

        setClient: function (client_new) {
            client = client_new;
        }
    }
});

vetApplication.factory('Pets', function() {
    let pets = [];

    return {
        getPets: function () {
            return pets;
        },

        setPets: function (pets_new) {
            pets = pets_new;
        },

        addPet: function (pet_new) {
            pets.push(pet_new);
        }
    }
});

vetApplication.controller('cl-controller', function($scope, $http, Client, Pets) {
    //Список питомцев
    $scope.pets = [];

    //Собственно сам клиент
    $scope.client = {};

    $scope.init = function(client, pets) {
        if (client && pets) {
            $scope.client = client;
            Client.setClient($scope.client);

            $scope.pets = pets;
            Pets.setPets($scope.pets);

            //Если все отрендерили, то проверим, не передали ли в ссылке id питомца и попробуем открыть вкладку с ним
            let url = new URL(window.location.href),
                pet_id = url.searchParams.get('pet');

            if (pet_id) {
                setTimeout(function() {
                    let elem = document.querySelector('#pet-' + pet_id + '-tab');
                    if (elem) {$(elem).click();}
                }, 10);
            }
        } else {
            console.log('Init error', client, pets);
        }
    };

    $scope.editClientValue = function (e) {
        let elem, name, target, width = 0, input;

        elem = e.target;
        while (!elem.getAttribute('data-source')) {
            elem = elem.parentNode;
        }

        name = elem.getAttribute('data-source');
        elem.style.display = "none";

        target = document.querySelector('[data-target="' + name + '"]');
        if ($scope.client[name]) {
            width = ($scope.client[name].length + 2) * 10;
        }

        (width < 200)? width = 200 : null;
        target.style.width = width + 'px';

        if (target.getAttribute('data-display')) {
            target.style.removeProperty('display');
        } else {
            target.style.display = "inline-flex";
        }

        input = target.querySelector('input');
        if (input.type !== 'radio') {
            if (name.substr(0, 3) === 'pet') {
                //mask pet-fieldname-pet_id
                let array = name.split('-');

                //Если редактируем породу питомца, то сразу подтягиваем динамический поиск по породам в зависимости от типа питомца
                if (array[1] === 'breed') {
                    let breedInput = $(target.querySelector('.pet-breed-live-search'));

                    //При динамическом добавлении живого поиска, старый не удаляется стандартными методами, приходится чистить руками
                    breedInput.parent().find('.typeahead__result').remove();

                    let typehead_pet_breed = _vet_configs.typehead_pet_breed;
                    typehead_pet_breed.source.pet_breeds.ajax.url = '/api/get_pet_breeds_by_type_id?id=' + $scope.pets[array[2]]['type_id'];

                    $(breedInput).typeahead(typehead_pet_breed);
                }

                input.value = $scope.pets[array[2]][array[1]];
            } else {
                input.value = $scope.client[name];
            }
        }

        input.focus();
    };

    $scope.saveClientValue = function (e) {
        let elem, name, value, source, input, parent;

        elem = e.target;
        while (!elem.getAttribute('data-target')) {
            elem = elem.parentNode;
        }

        parent = elem.closest('.pets-list-repeat');

        name = elem.getAttribute('data-target');
        input = elem.querySelector('input');
        if (!input) {
            input = elem.querySelector('textarea');
        } else if (input.type === 'radio') {
            input = elem.querySelector('input:checked');
        }
        value = input.value;

        if (value && value.length) {
            let array = name.split('-');
            //mask pet-fieldname-pet_id
            if (array[0] === 'pet' && value + '' !== $scope.pets[array[2]][array[1]] + '') {
                $http.post('/api/editPet', {id: $scope.pets[array[2]].id, field: array[1], value: value})
                    .success(function (data) {
                        if (data.success) {
                            $scope.pets[array[2]][array[1]] = value;
                            switch (array[1]) {
                                case 'type':
                                    //Если меняем тип животного, то сначала смотрим на ответ сервера, там должен прийти type_id измененного типа, а далее сбрасываем породу ввиду иерархического справочника
                                    if (data.data != null) {
                                        $scope.pets[array[2]]['type_id'] = data.data;
                                    }

                                    $scope.pets[array[2]]['breed'] = null;
                                    break;
                                case 'birthday':
                                    //Если сменили дату рождения, пересчитаем возраст
                                    setTimeout(function() {window['_client'].set_birthday_text(parent)}, 0);
                                    break;
                            }

                            new Noty({
                                text: 'Изменения сохранены.',
                                type: 'success'
                            }).show();
                        } else {
                            new Noty({
                                text: data.err,
                                type: 'error'
                            }).show();
                        }
                    });
            } else if (array[0] !== 'pet' && value !== $scope.client[name]) {
                $http.post('/api/editClient', {id: $scope.client.id, field: name, value: value})
                    .success(function (data) {
                        if (data.success) {
                            $scope.client[name] = value;

                            new Noty({
                                text: 'Изменения сохранены.',
                                type: 'success'
                            }).show();
                        } else {
                            new Noty({
                                text: data.err,
                                type: 'error'
                            }).show();
                        }
                    });
            }
        }

        source = document.querySelector('[data-source="' + name + '"]');
        if (source) {
            elem.style.display = "none";
            source.style.display = "inline-block"
        }
    };

    $scope.abortSaveClientValue = function (e) {
        let elem, name, source;

        elem = e.target;

        while (!elem.getAttribute('data-target')) {
            elem = elem.parentNode;
        }

        name = elem.getAttribute('data-target');

        source = document.querySelector('[data-source="' + name + '"]');

        if (source) {
            elem.style.display = "none";
            source.style.display = "inline-block"
        }
    };

    $scope.showPetWeightHistory = function(e, index, pet_id) {
        let collapse = $('#pet-weight-history-' + index);

        if (!collapse.hasClass('show') && !window['pet-weight-chart-' + pet_id]) {
            $http.post('/api/getPetWeightHistory', {pet_id: pet_id})
                .success(function (data) {
                    if (data.success) {
                        let chartColor = 'rgb(54, 162, 235)'; //Blue
                        //Строим график
                        let config = {
                            type: 'line',
                            data: {
                                datasets: [{
                                    data: [],
                                    borderColor: chartColor,
                                    backgroundColor: Chart.helpers.color(chartColor).alpha(0.5).rgbString(),
                                    fill: true
                                }]
                            },
                            options: {
                                responsive: true,
                                title:{
                                    display: true,
                                    text: 'График истории изменения веса питомца '
                                },
                                scales: {
                                    xAxes: [{
                                        type: 'time',
                                        display: true,
                                        scaleLabel: {
                                            display: true,
                                            labelString: 'Дата'
                                        }
                                    }],
                                    yAxes: [{
                                        display: true,
                                        scaleLabel: {
                                            display: true,
                                            labelString: 'Вес, кг'
                                        },
                                        ticks : {
                                            beginAtZero : true
                                        }
                                    }]
                                },
                                legend: {
                                    display: false
                                },
                                tooltips: {
                                    custom: function(tooltip) {
                                        if (!tooltip) return;
                                        // disable displaying the color box;
                                        tooltip.displayColors = false;
                                    },
                                    callbacks: {
                                        title: function(tooltipItem) {
                                            if (Array.isArray(tooltipItem) && tooltipItem[0]) {tooltipItem = tooltipItem[0]}
                                            return moment(tooltipItem.xLabel).format('DD.MM.YYYY HH:mm');
                                        },
                                        label: function(tooltipItem) {
                                            if (Array.isArray(tooltipItem) && tooltipItem[0]) {tooltipItem = tooltipItem[0]}
                                            return tooltipItem.yLabel + ' кг';
                                        }
                                    }
                                }
                            }
                        };

                        for (let i = 0; i < data.data.length; i++) {
                            config.data.datasets[0].data.push({
                                x: data.data[i].weight_time, //Дата фиксации веса
                                y: data.data[i].weight//Вес
                            });
                        }

                        let ctx = document.getElementById('pet-weight-history-chart-' + pet_id).getContext("2d");
                        window['pet-weight-chart-' + pet_id] = new Chart(ctx, config);

                        collapse.collapse('toggle');
                    } else {
                        new Noty({
                            text: data.err,
                            type: 'error'
                        }).show();
                    }
                });
        } else {
            collapse.collapse('toggle');
        }
    }
});

vetApplication.controller('modal-add-pet', function($scope, $http, Client, Pets) {
    //Добавление нового питомца
    $scope.addPetData = {};

    $scope.addPetSubmit = function() {
        let modal = document.querySelector('#add-pet-modal');

        //Разберемся с датами, система хитрая(зачеркнуто) дурацкая, но мне показалось, что удобная для пользователя
        //Первое, если точно передан день рождения, то просто его сохраняем и помечаем что д.р. "точный"
        if ($scope.addPetData.birthday) {
            $scope.addPetData.birthday_is_exact = true;
        } else if ($scope.addPetData.years || $scope.addPetData.months) { //Если передан только кол-во лет / месяцев, вычисляем дату рождения отрезанную до месяца
            let birthday;
            $scope.addPetData.months = ($scope.addPetData.months)? Number($scope.addPetData.months) : 0;
            $scope.addPetData.years = ($scope.addPetData.years)? Number($scope.addPetData.years) : 0;

            //Вычитаем из сегодня кол-во лет и месяцев и приводим в необходимый формат
            birthday = moment().add($scope.addPetData.years * -1, 'year').add($scope.addPetData.months * -1, 'month').format('01.MM.YYYY');

            $scope.addPetData.birthday = birthday;
            $scope.addPetData.birthday_is_exact = false;
        }

        //Жуткий костыль, т.к. в этой функции почему-то $scope.client пустой. Надо изучать angular...
        if (modal && modal.querySelector('#client-id')) {
            $scope.addPetData.client_id = modal.querySelector('#client-id').value;
        }

        //console.log($scope.addPetData);
        //Отправляем, то, что получилось на сьедение базе
        $http.post('/api/addPet', $scope.addPetData)
            .success(function (data) {
                if (data.success) {
                    $scope.addPet.$setPristine();
                    $scope.addPet.$setUntouched();
                    $scope.addPetData = {};

                    Pets.addPet(data.pet);

                    new Noty({
                        text: 'Питомец добавлен.',
                        type: 'success'
                    }).show();

                    setTimeout(function() {
                        let tabs = document.querySelectorAll('#tabs li.pets-tabs a'),
                            tab = $(tabs[tabs.length - 1]);

                        tab.click(window['_client'].tab_click_function);
                        tab.click();

                        $(modal).modal('hide');
                    }, 50);
                } else {
                    new Noty({
                        text: data.err,
                        type: 'error'
                    }).show();
                }
            });
    };

    //Срабатывает при заполнении даты, высчитываем примерный возраст
    $scope.setAge = function(e) {
        let modal, elem, date, ageYearField, ageMonthField, now = moment(),
            years, months;

        elem = e.target;
        modal = document.querySelector('#add-pet-modal');
        if (elem.value && elem.value.length
            && modal) {
            date = moment(elem.value, 'DD.MM.YYYY');
            years = now.diff(date, 'years');
            months = now.diff(date, 'months');

            //Вычитаем полные года из кол-ва месяцев
            months = months - years * 12;

            ageYearField = modal.querySelector('#new-cl-pet-age-year');
            ageMonthField = modal.querySelector('#new-cl-pet-age-month');

            ageYearField.value = years;
            ageMonthField.value = months;
        }
    };

    //При заполнении лет автоматом проставим 0 в поле "мес"
    $scope.setAgeMonth = function(e) {
        let modal, elem, ageMonthField;

        elem = e.target;
        modal = document.querySelector('#add-pet-modal');
        if (elem.value && elem.value.length
            && modal) {
            ageMonthField = modal.querySelector('#new-cl-pet-age-month');

            if (ageMonthField
                && !ageMonthField.value) {
                ageMonthField.value = 0;
            }
        }
    };

    //При заполнении месяца автоматом проставим 0 в поле "лет"
    $scope.setAgeYear = function(e) {
        let modal, elem, ageYearField;

        elem = e.target;
        modal = document.querySelector('#add-pet-modal');
        if (elem.value && elem.value.length
            && modal) {
            ageYearField = modal.querySelector('#new-cl-pet-age-year');

            if (ageYearField
                && !ageYearField.value) {
                ageYearField.value = 0;
            }
        }
    };
});

//Добавление новой записи питомца
vetApplication.controller('modal-add-pet-event', function($scope, $http, Client, Pets) {
    $scope.addPetEventData = {};
    $scope.addPetEventData.type_id = '1';

    $scope.addPetEventSubmit = function() {
        let modal = document.querySelector('#add-pet-event-modal');

        console.log($scope.addPetEventData);

        return;

        //console.log($scope.addPetData);
        //Отправляем, то, что получилось на сьедение базе
        $http.post('/api/addPetEvent', $scope.addPetEventData)
            .success(function (data) {
                if (data.success) {
                    $scope.addPetEvent.$setPristine();
                    $scope.addPetEvent.$setUntouched();
                    $scope.addPetEventData = {};
                    $scope.addPetEventData.type_id = '1';

                    new Noty({
                        text: 'Питомец добавлен.',
                        type: 'success'
                    }).show();
                } else {
                    new Noty({
                        text: data.err,
                        type: 'error'
                    }).show();
                }
            });
    };
});

vetApplication.directive("datetimepicker", function () {
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

            elem.datetimepicker({
                locale: 'ru',
                format: 'DD.MM.YYYY HH:mm',
                sideBySide: true,
                icons: {
                    up: 'fas fa-arrow-up',
                    down: 'fas fa-arrow-down'
                }
            });

            elem.on('dp.change', function (e) {
                updateModel();
            });
        }
    }
});

/*  init block  */
$(document).ready(function() {
    window['_client'] = window['_client']? window['_client'] : {};
    window['_client'].pet_id_active = 0;
    window['_client'].tab_click_function = function (e) {
        e.preventDefault();
        let elem = this, path = window.location.pathname,
            pet_id = elem.id.match(/[0-9]+/i)[0];

        if (window['_client'].pet_id_active !== pet_id) {
            $(this).tab('show');
            //При выборе вкладки с питомцем, установим его id в скрытый input модального окна добавления записи
            $('#event-pet-id').val(pet_id).trigger('input');
            window['_client'].pet_id_active = pet_id;
            window.history.pushState({pet_id: pet_id}, '', path + '?pet=' + pet_id);
        }
    };

    //Функция высчитывает возраст питомца в целых годах и месяцах и прописывает его текстом
    window['_client'].set_birthday_text = function (pet_element) {
        let birthday_date = pet_element.querySelector('.pet-birthday > div > div > h3')? pet_element.querySelector('.pet-birthday > div > div > h3').innerHTML : '',
            birthday_text = pet_element.querySelector('.pet-birthday-text'),
            m = moment().diff(moment(birthday_date, 'DD.MM.YYYY'), 'month'),
            y;

        y = Math.floor(m / 12);
        m = m % 12;

        switch (y) {
            case 0:
                y = null;
                break;
            case 1:
                y = y + ' год';
                break;
            case 2:
            case 3:
            case 4:
                y = y + ' года';
                break;
            default:
                y = y + ' лет';
        }

        switch (m) {
            case 0:
                m = null;
                break;
            case 1:
                m = m + ' месяц';
                break;
            case 2:
            case 3:
            case 4:
                m = m + ' месяца';
                break;
            default:
                m = m + ' месяцев';
        }

        if (y || m) {
            birthday_text.innerHTML = '(' + (y? y : '') + ((y && m)? ' ' : '') + (m? m : '') + ')';
        } else {
            birthday_text.innerHTML = '(меньше месяца)';
        }
    };

    /*  navBar active link  */
    $('.nav a#client').parent().addClass('active');

    $("#inputPhone").mask("(999) 9999999");

    $('#tabs a').click(window['_client'].tab_click_function);

    /* Окно добавления питомца, активация "живого" поиска на тип и породу */
    //Список типов питомцев и динамически подтягиваем список пород привязанных к выбранному типу
    let modal = document.querySelector('#add-pet-modal'),
        typeInput = $(modal.querySelector('.pet-type-live-search')),
        breedInput = $(modal.querySelector('.pet-breed-live-search')),
        modalAddPetEvent = document.querySelector('#add-pet-event-modal');

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

    typeInput.typeahead(typehead_pet_type);

    $(modalAddPetEvent).on('show.bs.modal', function() {
        let dateInput = modalAddPetEvent.querySelector('#new-pet-event-time');
        $(dateInput).val(moment().format('DD.MM.YYYY HH:mm')).trigger('input');
    });
});


var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
}

const DRIVER_STATUS_HIDE =  0;
const DRIVER_STATUS_FINDER = 1;
const DRIVER_STATUS_WORK =  2;
const ORDER_STATUS_OPEN =   1;
const ORDER_STATUS_ACCEPT = 2;
const ORDER_STATUS_WAIT =   3;
const ORDER_STATUS_ACTION = 4;
const ORDER_STATUS_DONE =   5;
const ORDER_STATUS_CANCEL = 6;
const ORDER_STATUS_DROP =   7;
const ROLE_CLIENT =  1;
const ROLE_DRIVER =  2;

var act;

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http, ws, map){

    MicroEvent.mixin(ws);

    // -------------- INIT VARIABLES ----------------

    //$scope.currents = [];
    //$scope.delays = [];
    $scope.orders = [];
    $scope.genders = [
        { name: 'Мужской', value: 1 },
        { name: 'Женский', value: 2 }
    ];
    $scope.d_statuses = {
        0: 'Не в статусе',
        1: 'В поиске заказа',
        2: 'На заказе'
    };
    $scope.me = {};
    $scope.order = {
        option: {
            capacity: 0,
            child: 0,
            conditioner: false,
            pets: false,
            passengers: 1,
            smoking: false,
            comment: ''
        },
        status: 0,
        distance: 0
    };
    $scope.showConfirmForm = false;
    $scope.orderAdresses = [{name: ''}, {name: ''}];
    $scope.car = {};


    // --------------- URL PARSING ------------------
    var urlParams;
    $scope.loadPage = function(url){
        var hash = location.hash;
        if(url) {
            location.hash = url;
            hash = url;
        }
        urlParams = hash.split('/').splice(1);
        var page = urlParams[0];
        if(!page) page = 'home';

        $scope.curPage = page;

        if(page == 'login')
            $scope.template = 'templates/' + page + '.html';
        else
            $scope.template = 'templates/driver/' + page + '.html';
    }

    $('body').on('click', 'a.page-link', function(){
        var url = $(this).attr('href');
        $scope.loadPage(url);
        $scope.$apply();
        return false;
    });

    // ------------ START FUNCTIONS --------------


    if(ws.checkToken()){
        ws.connect();
    } else {
        $scope.loadPage('#/login');
    }


    function checkAuth(){

        if(localStorage.access_token && localStorage.refresh_token && localStorage.phone) {
            // подключаемся к сокету автоматически

            ws.connect();

        } else {
            // показываем форму для авторизации
            $scope.me.phone = localStorage.phone;
            location.hash = '#/login';
            $scope.loadPage('#/login');
        }

    }

    // ------------ SUBMIT FORMS --------------

    $scope.register = function(phone){

        if(!phone){
            alert('Введите номер телефона!!!1!');
            return;
        }
        var num = parseInt(phone.substr(-10));
        if(num / num) {

            ws.register(num, ROLE_DRIVER, function(res){
                $scope.me.phone = num + '';
                $scope.smsCode = res.sms_code;
                $scope.showConfirmForm = true;
            });

        } else {
            alert('Введите корректный номер телефона');
        }

    }


    $scope.auth = function(code){

        ws.getToken({phone: $scope.me.phone, code: code}, function(){
            ws.connect();
        });

    }

    $scope.logout = function(){
        localStorage.access_token = '';
        localStorage.refresh_token = '';
        localStorage.phone = '';
        location.reload();
    }

    $scope.setRole = function(role){
        $scope.me.role = role;

        ws.socket.emit2('user:profile', {role: role}, function(res){
            if(!res.error) {
                if(role == 1) location.href = 'client.html';
            }
        });

    }

    $scope.saveImage = function(type, element){

        var fd = new FormData();
        fd.append('image', $('#' + element)[0].files[0]);

        $.ajax({
            type: 'POST',
            url: '/api/upload/' + type,
            data: fd,
            headers: {
                token: localStorage.access_token,
                phone: localStorage.phone
            },
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(data) {
                if(data.error) {
                    $scope.operation_success_file = data.error;
                } else {
                    $scope.operation_success_file = 'Изображение загружено';
                    if(!$scope.me.photos) $scope.me.photos = {};
                    if(type == 'avatar') {
                        $scope.me.avatar = data.url;
                    } else {
                        $scope.me.photos[type] = data.url;
                    }
                }
                $scope.$apply();
            },
            error: function(data) {
                console.log('error', data);
                $scope.operation_success_file = 'Ошибка загрузки';
                $scope.$apply();
            }
        });

    }
    $scope.uploadVerifImage = function(type, element){

        var fd = new FormData();
        fd.append('image', $('#' + element)[0].files[0]);

        $.ajax({
            type: 'POST',
            url: '/api/verification/' + type,
            data: fd,
            headers: {
                token: localStorage.access_token,
                phone: localStorage.phone
            },
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(data) {
                if(data.error) {
                    console.log({error: data.error});
                } else {

                    if(!$scope.me.verification.photos) {
                        $scope.me.verification.photos = {};
                    }

                    $scope.me.verification.photos[type] = data.url;

                    $scope.$apply();
                }
            },
            error: function(data) {
                console.log({error: data});
            }
        });

    }
    $scope.checkOrderType = function(orders, mode){
        if(!orders.length) return 0;
        var a1 = 0, a2 = 0;
        orders.forEach(function(ord){
            if(ord.date) a2++; else a1++;
        });
        if(mode == 1) return a1;
        if(mode == 2) return a2;
    }

    $scope.saveCarImage = function(type, element, car){

        var fd = new FormData();
        fd.append('image', $('#' + element)[0].files[0]);

        $.ajax({
            type: 'POST',
            url: '/api/car/upload/' + type + '/' + car._id,
            data: fd,
            headers: {
                token: localStorage.access_token,
                phone: localStorage.phone
            },
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(data) {
                if(data.error) {
                    $scope.operation_success_file = data.error;
                } else {
                    $scope.operation_success_file = 'Изображение загружено';

                    if(!car.photos) car.photos = {};
                    car.photos[type] = data.url;

                }
                $scope.$apply();
            },
            error: function(data) {
                console.log('error', data);
                $scope.operation_success_file = 'Ошибка загрузки';
                $scope.$apply();
            }
        });

    }

    $scope.saveProfile = function(me){

        ws.socket.emit2('user:profile', {
            gender: me.gender,
            birthday: moment(me.birthday).format(),
            name: me.name
        }, function(data){

            $scope.operation_success = 'Профиль сохранен';
            $scope.$apply();

        });

    }

    $scope.addCar = function(car){

        car.mode = 2;

        ws.socket.emit2('car:new', car, function(data){

            car.tarif.title = 'Тариф для ' + car.number;
            ws.socket.emit2('tarif:create', car.tarif, function(tarif){
                ws.socket.emit2('car:tarif', {car: data._id, tarif: tarif._id}, function(link){

                });
                $scope.loadPage('#/cars');
                $scope.$apply();
            });


        });
    }

    $scope.selectCar = function(carId){

        ws.socket.emit2('car:select', {'_id': carId}, function(data){
            $scope.me.car = data;
            $scope.$apply();
        });

    }
    $scope.removeCar = function(carId){

        ws.socket.emit('car:remove', {'_id': carId}, function(data){

            if(data.error) {

                alert(data.error);

            } else {
                $scope.me.cars = data;
                $scope.$apply();
            }
        });

    }

    $scope.requestMyCars = function(){
        ws.socket.emit('car:list', {}, function(data){
            $scope.me.cars = data.cars;
            $scope.$apply();
        });
    }

    $scope.editCar = function(car){
        $scope.editcar = car;
        $scope.loadPage('#/editcar');
    }

    $scope.saveEditingCar = function(car){

        if(car.mode != 1) car.mode = 2;

		if(car.mode == 2) {
			// если тариф мой, то обновляем его
            ws.socket.emit2('tarif:edit', car.tarif, function(data){

            });
		}

        car.tarif = car.tarif._id;
        car.model = car.model._id;

        ws.socket.emit2('car:edit', car, function(data){
            $scope.loadPage('#/cars');
            $scope.$apply();
        });
    }

    $scope.loadCarBrands = function(){

        $http.get('/api/cars/brands').success(function(res){
            $scope.carBrands = [];
            for(var i in res) {
                $scope.carBrands.push({name: res[i].name, value: res[i].code});
            }
            $scope.carBrand = res[0].code;
        });

    }

    $scope.selectBrand = function(brand){
        $http.get('/api/cars/models/' + brand).success(function(res){

            $scope.carModels = [];
            for(var i in res) {
                $scope.carModels.push({name: res[i].model, value: res[i].model, image: res[i].image_url, _id: res[i]._id});
            }
            $scope.carModel = res[0].model;
            $scope.selectedCarModelImage = res[0].image_url;
            $scope.car.model = res[0]._id;
        });
    }

    $scope.selectModel = function(model) {

        $scope.carModels.forEach(function(elem){
            if(elem.value == model) {
                $scope.selectedCarModelImage = elem.image;
                $scope.car.model = elem._id;
            }
        });

    }

    $scope.vote = function(order) {

        order.is_voted = !order.is_voted;

        ws.socket.emit2('order:vote', {id: order._id, state: order.is_voted}, function(data){

        });

    }
    $scope.cancelActiveOrder = function(){

        if($scope.me.order) {

            ws.socket.emit2('order:cancel', {id: $scope.me.order._id}, function(res){
                if(res.error) {
                    alert(res.error);
                } else {
                    $scope.me.order = null;
                    $scope.loadPage('#/home');
                    $scope.$apply();
                }
            });

        } else {
            alert('Нет активного заказа');
        }

    }
    $scope.requestRegionTarif = function(carId){

        if($scope.editcar.mode == 1) {

            // запрашиваем диспетчерский тариф

            ws.socket.emit2('tarif:dispatcher', {car: carId}, function(res){
                if(res.error) {
                    alert(res.error);
                } else {
                    //$scope.tarifDispatcher = res;
                    $scope.editcar.tarif = res;
                    $scope.$apply();
                }
            });

        } else {

            // подставляем один из моих тарифов

            $scope.me.tarifs.forEach(function(tarif){
                if($scope.editcar.mode == tarif._id) {

                    $scope.editcar.tarif = tarif;

                }
            });

        }

    }

    $scope.verifCheck = function(){


        ws.socket.emit2('user:checkout', {}, function(data){
            if(data.error) {
                alert(data.error);
            } else {

                $scope.me.verification = data;
                $scope.loadPage('#/home');
                $scope.$apply();

            }
        });

    }

    $scope.imageUrlFilter = function(url){
        if(url[0] == '/') {
            return 'http:' + url;
        } else {
            return url;
        }
    }

    // -------------- Socket events -----------------

    ws.on('disconnect', function(data){
        console.log('Дисконнект!');
    });

    ws.on('ready', function(data){

        if(data.error) {

            console.log('Ошибка при подключении к сокету:', data.error);

            if(data.code == 4) {
                // если вышел срок токена

                ws.refresh(function(){
                    ws.connect();
                });

            } else {
                // если какая-то другая ошибка, то показываем форму авторизации
                $scope.loadPage('#/login');

            }

        } else {

            if(data.role == ROLE_CLIENT) {
                location.href = 'client.html';
                return;
            }

            $scope.me = data;
            $scope.me.order = data.currentOrder;
            $scope.me.birthday = new Date(data.birthday);
            $scope.codeOK = 'Вы успешно авторизовались!';

            var urlParams = location.hash.split('/').splice(1);
            if(urlParams[0]) {
                $scope.loadPage(location.hash);
            } else {
                $scope.loadPage('#/home');
            }

            if(data.currentOrder) {
                $scope.loadPage('#/active');
            }


        }
        $scope.$apply();
    });

    ws.on('order:opened', function(order){

        $scope.orders.push(order);
        $scope.$apply();

    });
    ws.on('order:appointed', function(order){

        $scope.me.order = order;
        $scope.loadPage('#/active');
        $scope.$apply();

    });
    ws.on('order:accepted', function(order){

        //$scope.orders.push(order);
        //$scope.$apply();

    });
    ws.on('order:update', function(order){

        //$scope.me.order = order;
        //$scope.loadPage('#/active');
        //$scope.$apply();

    });
    ws.on('order:changes', function(order){

        // убираем заказ из списка
        if(order.status > 1) {
            for(var i in $scope.orders) {
                if($scope.orders[i]._id == order._id) {
                    $scope.orders.splice(i, 1);
                }
            }
        }

        if(order.status >= 8) {

            $scope.me.order = undefined;
            $scope.loadPage('#/home');

        }

        $scope.$apply();

    });

});
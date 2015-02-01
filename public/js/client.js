
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

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http, ws, map){

    MicroEvent.mixin(ws);

    // -------------- INIT VARIABLES ----------------

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
        distance: 0,
        is_delayed: false
    };
    $scope.showConfirmForm = false;
    $scope.orderAdresses = [{name: ''}, {name: ''}];


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
        if(page == 'login')
            $scope.template = 'templates/' + page + '.html';
        else
            $scope.template = 'templates/client/' + page + '.html';
    }

    $('body').on('click', 'a.page-link', function(){
        var url = $(this).attr('href');
        $scope.loadPage(url);
        $scope.$apply();
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


    //checkAuth();



    // ------------ SUBMIT FORMS --------------

    $scope.register = function(phone){

        if(!phone){
            alert('Введите номер телефона!!!1!');
            return;
        }
        var num = parseInt(phone.substr(-10));
        if(num / num) {

            ws.register(num, ROLE_CLIENT, function(res){

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

    $scope.saveProfile = function(me){

        ws.socket.emit2('user:profile', {
            role: me.role,
            gender: me.gender,
            birthday: Math.round(me.birthday.valueOf() / 1000),
            name: me.name
        }, function(data){

            $scope.operation_success = 'Профиль сохранен';
            $scope.$apply();

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

    $scope.createOrder = function(order){

        for(var i in $scope.orderAdresses) {
            if(!$scope.orderAdresses[i].lat) {
                alert('Не все адреса заполнены верно!');
                return false;
            }
        }

        if(!order.date && order.is_delayed) {
            alert('Вы не указали дату заказа!');
            return false;
        }

        var points = [];
        $scope.orderAdresses.forEach(function(point){
            points.push({
                name: point.name,
                lat: point.lat,
                lon: point.lon
            });
        });

        ws.socket.emit2('order:open', {
            points: points,
            option: order.option,
            date: order.is_delayed ? moment(order.date).format() : ''
        }, function(data){
            if(data.error) {
                alert(data.error);
            } else {
                $scope.me.order = data;
                $scope.loadPage('#/home');
                $scope.$apply();
            }
        });

    }

    // -------------- CLICK LINKS ------------------

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
                if(role == 2) location.href = 'driver.html';
            }
        });

    }
    $scope.setCurrentTime = function(role){
        var rounded = Math.round(new Date().getTime() / 60000) * 60000;
        $scope.order.date = new Date(rounded);
    }
    $scope.addAddress = function(role){
        $scope.orderAdresses = push2($scope.orderAdresses, {name: ''});
    }
    $scope.delAddress = function(i){
        $scope.orderAdresses.splice(i, 1);
        map.removeMarkers();
        $scope.orderAdresses.forEach(function(pos){
            map.addMarker(pos);
        });
    }
    $scope.addressBlur = function(addr){

        if(addr.name) {

            ws.socket.emit2('geo:position', {address: $scope.me.region_name + ', ' +  addr.name}, function(res){
                if(res.error) {
                    addr.error = true;
                } else {

                    res = res[0];

                    addr.error = false;

                    addr.lat = res.lat;
                    addr.lon = res.lon;
                    addr.name =  res.name;

                    map.removeMarkers();
                    $scope.orderAdresses.forEach(function(pos){
                        map.addMarker(pos);
                    });

                    var rPoints = [];
                    $scope.orderAdresses.forEach(function(rPoint){
                        if(rPoint.lat) rPoints.push({
                            lat: rPoint.lat,
                            lon: rPoint.lon
                        });
                    });


                    if(rPoints.length >= 2) {

                        ws.socket.emit2('route:points', rPoints, function(points){

                            map.setRoute(points.path);
                            $scope.order.distance = (points.distance / 1000).toFixed(1);
                            $scope.$apply();

                        });

                    }

                }
                $scope.$apply();
            });

        } else {
            addr.error = true;
        }


    }
    $scope.setNow = function(val){
        $scope.order.is_delayed = val;

    }
    $scope.makeOrderMap = function(){

        setTimeout(function(){
            map.createMap();
        }, 1000);

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
    $scope.calcOrder = function(order, tarif){

        return Math.round(order.distance * tarif.distance / 1000 + tarif.delivery);

    }
    $scope.appointDriver = function(driver){

        ws.socket.emit2('order:appoint', {id: $scope.me.order._id, driver: driver._id}, function(res){

            console.log('appointed by me', res);

            if(res.error) {
                alert(res.error);
            } else {
                $scope.me.order = res;
                $scope.loadPage('#/order');
                $scope.$apply();
            }
        });

    }


    $scope.reqAddresses = function(){

        ws.socket.emit2('user:addresses_history', {}, function(res){

            $scope.addresses_history = res;
            $scope.$apply();

        });

    }

    $scope.sendFeedback = function(fb){

        fb._id = $scope.me.order._id;
        ws.socket.emit2('order:feedback', fb, function(res){


        });

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

            if(data.role == ROLE_DRIVER) {
                location.href = 'driver.html';
                return;
            }

            $scope.me = data;
            $scope.me.order = data.currentOrder;

            $scope.me.birthday = new Date(data.birthday);
            $scope.codeOK = 'Вы успешно авторизовались!';

            if(data.currentOrder && data.currentOrder.status > 1) {
                $scope.loadPage('#/order');
            } else {
                $scope.loadPage('#/home');
            }

        }
        $scope.$apply();
    });

    ws.on('order:voted', function(data){

        if(data.state) {

            if(!$scope.me.order.voted_drivers) $scope.me.order.voted_drivers = [];

            $scope.me.order.voted_drivers.push(data.driver);

        } else {

            for(var i in $scope.me.order.voted_drivers) {
                if($scope.me.order.voted_drivers[i]._id == data.driver._id) {
                    $scope.me.order.voted_drivers.splice(i, 1);
                    break;
                }
            }

        }

        $scope.$apply();

    });

    ws.on('order:appointed', function(data){

        $scope.me.order = data;
        $scope.loadPage('#/order');

        $scope.$apply();

    });

    ws.on('order:accepted', function(data){

        console.log('Водитель принял ваш заказ и поехал такой');

    });

    ws.on('order:changes', function(data){

        if(data.status >= 8) {
            // заказ отменен водителем

            $scope.me.order = undefined;
            $scope.loadPage('#/home');

        }

        $scope.$apply();

    });




});
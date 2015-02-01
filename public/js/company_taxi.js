
var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
}

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){

    $scope.tarifs = [];
    $scope.cars = [];
    $scope.forms = {car:{}};
    $scope.logform = {};


    // --------------- URL PARSING ------------------
    var urlParams;
    $scope.loadPage = function(url){
        var hash;

        if(url) {
            hash = url;
            location.hash = url;
        } else {
            hash = location.hash;
        }

        urlParams = hash.split('/').splice(1);
        var page = urlParams[0];

        if(!$scope.me && !page) {
            page = 'login';
        }

        if(!$scope.me && page != 'login' && page != 'register') return false;

        if(!page) page = 'cars';
        $scope.curPage = page;
        $scope.template = 'templates/company_taxi/' + page + '.html';
        return true;
    }

    $('body').on('click', 'a.page-link', function(){
        var url = $(this).attr('href');
        $scope.loadPage(url);
        $scope.$apply();
        return false;
    });





    // FOMRS

    $scope.register = function(form){

        if(!form.pass) {
            alert('Укажите пароль!');
            return;
        }
        if(!form.name) {
            alert('Укажите название организации');
            return;
        }

        var user = {
            email: form.email,
            pass: hex_md5(form.pass),
            name: form.name
        }

        $http.post('/api/company/register/taxi', user).success(function(res){
            if(res.error) {
                alert(res.error);
            } else {
                //$scope.me = res;

                // отправили письмо с подтверждением и теперь пользователь должен перейти по ссылке в нем
                $('.help-block').html('Письмо на почтовый ящик <b>' + form.email + '</b> отправлено');

                //$scope.loadPage();
            }
        });

    }
    $scope.login = function(form){

        var user = {};
        var auto = true;

        if(form) {
            auto = false;
            user = {
                email: form.email,
                pass: hex_md5(form.pass)
            }
        }

        user.type = 1;      // COMPANY_TAXI

        $scope.loginErrorText = '';

        $http.post('/api/company/login', user).success(function(res){
            if(res.error) {
                console.log(res.error);
                if(res.error != 'Нет данных') $scope.loginErrorText = res.error;
                $scope.loadPage('#/login');
            } else {
                $scope.loginErrorText = '';
                $scope.me = res;
                $scope.tarifsLoad();
                $scope.carsLoad();
                $scope.loadCarBrands();
                if(auto) {
                    $scope.loadPage();
                } else {
                    $scope.loadPage('#/cars');
                }
            }
        });

    }
    $scope.logout = function(){

        $http.get('/api/company/logout').success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                $scope.me = null;
                $scope.tarifs = [];
                $scope.cars = [];
                $scope.forms = {car:{}};
                $scope.logform = {};
                $scope.loadPage('#/login');
            }
        });

    }
    $scope.saveProfile = function(){

        $http.put('/api/company/profile', {name: $scope.me.name}).success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                $scope.me.name = res.name;
                alert('Сохранено успешно');
            }
        });

    }

    //  TARIFS ************************

    $scope.tarifNewOpen = function(){
        $scope.forms.tarif = {};
        $('#tarifNewModal').modal({});
    }
    $scope.tarifNew = function(data){

        $http.post('/api/company/tarif', data).success(function(res){
            if(res.error) {
                console.log(res);
            } else {
                $scope.tarifs.push(res);
                $scope.forms.tarif = {};
            }
        });

        $('.close-modal').trigger('click');
    }
    $scope.tarifsLoad = function(){
        $http.get('/api/company/tarifs').success(function(res){
            $scope.tarifs = res;
        });
    };
    $scope.tarifRemove = function(id){

        $http.delete('/api/company/tarif/' + id).success(function(res){
            $scope.tarifsLoad();
        });

    };
    $scope.tarifEditOpen = function(tarif){
        $scope.forms.tarif = tarif;
        $('#tarifEditModal').modal({});
    };
    $scope.tarifEdit = function(tarif){
        $http.put('/api/company/tarif/' + tarif._id, tarif).success(function(res){
            $('.close-modal').trigger('click');
        });
    };


    // CARS ***********************


    $scope.carsLoad = function(){
        $http.get('/api/company/cars').success(function(res){
            $scope.cars = res;
        });
    };
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
            $scope.forms.car.model = res[0]._id;
        });
    }
    $scope.selectModel = function(model) {

        $scope.carModels.forEach(function(elem){
            if(elem.value == model) {
                $scope.selectedCarModelImage = elem.image;
                $scope.forms.car.model = elem._id;
            }
        });

    }
    $scope.carNewOpen = function(){
        $scope.forms.car = {};
        $('#carNewModal').modal({});
    }
    $scope.carNew = function(car) {

        $http.post('/api/company/car', car).success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                $scope.cars.push(res);
                $scope.forms.car = {};
            }
        });

        $('.close-modal').trigger('click');
    };
    $scope.removeCar = function(id){
        $http.delete('/api/company/car/' + id).success(function(res){
            $scope.carsLoad();
        });
    };
    $scope.carEditOpen = function(car){
        $scope.forms.car = car;
        $('#carEditModal').modal({});
    };
    $scope.carEdit = function(car){

        console.log(car);

        $http.put('/api/company/car/' + car._id, car).success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                $('.close-modal').trigger('click');
            }
        });
    };
    $scope.carTarif = function(car){

        var data = {
            tarif: car.tarif
        }

        $http.put('/api/company/car/' + car._id, data).success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {

            }
        });

    };

    // INIT ***********************

    $scope.login();

});
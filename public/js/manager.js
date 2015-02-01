/**
 * Created by aleksej on 21.11.14.
 */

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){

    $scope.approves = [];
    $scope.fills = [];
    $scope.notFound = false;
    $scope.query = '';



    // список жалоб для клиента
    $scope.abuses_list_1 = {
        1: 'Грязный салон/машина',
        2: 'В салоне накурено',
        3: 'Грубый водитель',
        4: 'Не знает города или не может найти клиента',
        5: 'Автомобиль - после ДТП или неисправен',
        6: 'Не соответствует описанию'
    }

// список жалоб для водителя
    $scope.abuses_list_1 = {
        1: 'Агресивный клиент',
        2: 'Не хочет платить',
        3: 'В пьяном или неадекватном состоянии'
    }


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

        if(page == 'register' && urlParams[1]) {
            user_id = urlParams[1];
        }

        if(!page) page = 'search';
        $scope.curPage = page;
        $scope.template = 'templates/manager/' + page + '.html';
        return true;
    }

    $('body').on('click', 'a.page-link', function(){
        var url = $(this).attr('href');
        $scope.loadPage(url);
        $scope.$apply();
        return false;
    }).on('click', '.trigger', function(){

        if($(this).hasClass('fa-chevron-circle-down')) {
            $(this).parent().find('.trigger-block').slideDown();
            $(this).removeClass('fa-chevron-circle-down').addClass('fa-chevron-circle-up');
        } else {
            $(this).parent().find('.trigger-block').slideUp();
            $(this).removeClass('fa-chevron-circle-up').addClass('fa-chevron-circle-down');
        }

    }).on('click', '.btn-group-vertical button', function(){



    });

    // FOMRS

    $scope.login = function(form){


        $http.get('/api/employe/login').success(function(res){
            if(res.error) {
                location.href = '/';
            } else {
                console.log('ME', res);
                $scope.me = res;
                $scope.loadPage();

                requireUnfilled();
                requireUnchecked();
                requireAbuses();

            }
        });

    }
    $scope.logout = function(){

        $http.get('/api/employe/logout').success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                location.href = '/';
            }
        });

    }

    $scope.search = function(query){

        if(!query) return false;

        var q = {
            query: query.substr(-10)
        }

        $http.get('/api/manager/search/by_phone?' + $.param(q)).success(function(res) {

            console.log('by_phone', res);

            if(res.length === 0) {

                $http.get('/api/manager/search/by_carnum?' + $.param(q)).success(function(res) {

                    console.log('by_carnum', res);

                    if(res.length > 0) {
                        $scope.driver = res[0];
                        $scope.notFound = false;
                    } else {
                        console.log('Ничего не найдено');
                        $scope.driver = null;
                        $scope.notFound = true;
                    }

                });

            } else {
                $scope.driver = res[0];
                $scope.notFound = false;
                $('.btn-group-vertical button').tooltip({container: 'body'});
            }

        });

    };

    $scope.driverEditOpen = function(driver){
        console.log(driver);
    }

    $scope.driverConfirmed = function(driver){

        driver.confirmed = !driver.confirmed;

        var data = {confirmed: driver.confirmed};
        $http.put('/api/manager/user/' + driver._id, data).success(function(res){
            console.log(res);
        });

    }

    $scope.driverRequire = function(driver){

        if(driver.verification && driver.verification.status == 1) {

            console.log(driver.verification);

            $('#verificationModal').modal({});

            return false;
        }


        $http.post('/api/manager/checking', {driver: driver._id}).success(function(res){
            if(res.error) {
                alert(res.error);
            } else {

                console.log('verification', res);

                driver.verification = res;
                driver.confirmed = false;

            }
        });

    };

    $scope.verifAction = function(driver, mode){

        var data = {};

        if(mode == 1) {
            // подтвердть проверку

            driver.confirmed = true;
            driver.verification.status = 2;

            data = {
                confirmed: true,
                verification: driver.verification
            };

        } else if(mode == 2) {
            // запросить новую проверку (status = 0)

            driver.verification.status = 0;
            driver.confirmed = false;

            data = {
                confirmed: false,
                verification: driver.verification
            };

        } else {
            // заблокировать юзера (active = false)

            driver.confirmed = false;
            driver.active = false;
            driver.verification.status = 3;

            data = {
                confirmed: false,
                active: false,
                verification: driver.verification
            };

        }

        console.log('send', data);

        $http.put('/api/manager/driver/' + driver._id, data).success(function(res){
            if(res.error) {
                alert(res.error);
            } else {
                driver.verification = res.verification;
                console.log('confirmation', res);
            }
        });

        $('#verificationModal').modal('hide');

    };

    $scope.driverActive = function(driver){

        driver.active = !driver.active;

        var data = {active: driver.active};
        $http.put('/api/manager/user/' + driver._id, data).success(function(res){
            console.log(res);
        });

    }
    $scope.selectCarType = function(car){

        var data = {car_type: car.car_type._id};
        $http.put('/api/manager/car/' + car._id, data).success(function(res){
            console.log(res);
        });

    }
    $scope.getAge =  function(time){
        if(!time) return '-';
        var birth = new Date(time);
        var year = birth.getFullYear();
        var today = new Date();
        return today.getFullYear() - year - (today.getTime() < birth.setFullYear(year)) ;
    };
    $scope.getTypeByRegion =  function(region){
        var result = [];
        $scope.me.car_types.forEach(function(tp){
            if(tp.region_code == region) result.push(tp);
        });
        return result;
    };
    $scope.verifClasses =  function(verif){
        var classes = {};

        if(verif) {

            if(verif.status == 0) {
                classes['fa-spin'] = true;
                classes['fa-spinner'] = true;
            } else {
                classes['fa-bell-o'] = true;
                classes['red'] = true;
            }

        } else {
            classes['fa-flag'] = true;
        }

        return classes;
    };




    function requireUnfilled(){
        $http.get('/api/manager/unfilled_cars').success(function(res){
            $scope.fills = res;
        });
    }
    function requireAbuses(){
        $http.get('/api/manager/abuses').success(function(res){
            $scope.abuses = res;
        });
    }
    function requireUnchecked(){
        $http.get('/api/manager/unchecked').success(function(res){
            $scope.unchecked = res;

            console.log('unchecked', res);
        });
    }

    // INIT ***********************

    $scope.login();



});

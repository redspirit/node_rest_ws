/**
 * Created by aleksej on 20.11.14.
 */

var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
}

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){

    $scope.dispatchers = [];
    $scope.managers = [];
    $scope.forms = {};
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

        if(!page) page = 'dispatchers';
        $scope.curPage = page;
        $scope.template = 'templates/company_disp/' + page + '.html';
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

        $http.post('/api/company/register/disp', user).success(function(res){
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

        user.type = 2;      // COMPANY_DISP

        $scope.loginErrorText = '';

        $http.post('/api/company/login', user).success(function(res){
            if(res.error) {
                console.log(res.error);
                if(res.error != 'Нет данных') $scope.loginErrorText = res.error;
                $scope.loadPage('#/login');
            } else {
                $scope.loginErrorText = '';
                $scope.me = res;
                loadDispatchers();
                loadManagers();
                if(auto) {
                    $scope.loadPage();
                } else {
                    $scope.loadPage('#/dispatchers');
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



    /////// MODALS

    $scope.dispNewOpen = function(){
        $scope.forms.disp = {};
        $('#dispNewModal').modal({});
    }
    $scope.dispNew = function(disp){

        disp.pass =  hex_md5(disp.password);

        $http.post('/api/employe/dispatcher', disp).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка добавление диспетчера: ' + res.error);
            } else {
                $scope.dispatchers.push(res);
                $('#dispNewModal').modal('hide');
            }
        });

    }
    $scope.dispRemove = function(disp) {

        $http.delete('/api/employe/' + disp._id).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка удаления диспетчера: ' + res.error);
            } else {
                loadDispatchers();
            }
        });

    }
    $scope.dispEditOpen = function(disp){
        $scope.forms.disp = disp;
        $('#dispEditModal').modal({});
    }
    $scope.dispEdit = function(disp){

        var data = {
            name: disp.name,
            email: disp.email,
            active: disp.active,
            pass: disp.password ? hex_md5(disp.password) : '',
            number: disp.profile.number
        }

        $http.put('/api/employe/dispatcher/' + disp._id, data).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка изменения диспетчера: ' + res.error);
            } else {
                $('#dispEditModal').modal('hide');
            }
        });
    }


    $scope.managerNewOpen = function(){
        $scope.forms.manager = {};
        $('#managerNewModal').modal({});
    }
    $scope.managerNew = function(manager){

        $http.post('/api/employe/manager/', manager).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка добавление manager: ' + res.error);
            } else {
                $scope.managers.push(res);
                $('#managerNewModal').modal('hide');
            }
        });

    }
    $scope.managerRemove = function(manager) {

        $http.delete('/api/employe/' + manager._id).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка удаления manager: ' + res.error);
            } else {
                loadManagers();
            }
        });

    }
    $scope.managerEditOpen = function(manager){
        $scope.forms.manager = manager;
        $('#managerEditModal').modal({});
    }
    $scope.managerEdit = function(manager){

        var data = {
            name: manager.name
        }

        $http.put('/api/employe/manager/' + manager._id, data).success(function(res) {
            if(res.error) {
                console.log(res);
                alert('Ошибка изменения manager: ' + res.error);
            } else {
                $('#managerEditModal').modal('hide');
            }
        });
    }




    function loadDispatchers(){
        $http.get('/api/employe/dispatchers').success(function(res) {
            $scope.dispatchers = res;
        });
    }
    function loadManagers(){
        $http.get('/api/employe/managers').success(function(res) {
            $scope.managers = res;
        });
    }


    // INIT ***********************

    $scope.login();

});
/**
 * Created by aleksej on 02.12.14.
 */

var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
}

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){


    $scope.logform = {};
    $scope.regform = {};


    // FOMRS

    $scope.register = function(form){

        if(!form.pass || !form.email || !form.name || !form.alias) {
            alert('Заполните все поля');
            return;
        }

        var user = {
            pass: hex_md5(form.pass),
            name: form.name,
            email: form.email,
            alias: form.alias
        };

        $http.post('/api/company/register', user).success(function(res){
            if(res.error) {
                form.error = res.error;
                form.success = '';
            } else {
                form.error = '';
                form.success = 'Регистрация успешно завершена, можете закрыть это окно и войти под своим емейлом и паролем';
                console.log(res);
            }
        });

    };
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

        $scope.loginErrorText = '';

        $http.get('/api/employe/login?' + $.param(user)).success(function(res){
            if(res.error) {
                console.log(res.error);

                if(!auto) $scope.loginErrorText = res.error;

            } else {
                $scope.loginErrorText = '';


                if(res.type == 1) {
                    location.href = 'dispatcher.html';
                }
                if(res.type == 2) {
                    location.href = 'manager.html';
                }
                if(res.type == 3) {
                    location.href = 'admin.html';
                }
                if(res.type == 4) {
                    location.href = 'taxi.html';
                }

                console.log(res);

            }
        });

    }


    $scope.login();

});
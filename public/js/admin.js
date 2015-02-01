/**
 * Created by aleksej on 02.12.14.
 */

var ymaps, boundBox;
var app = angular.module('App', ['ngTable', 'ngResource', 'ymaps', 'textAngular']);
app.controller('MainCtrl', function($scope, $http, $filter, $resource, ngTableParams, ymapsLoader){

    $scope.modalForm = {};
    $scope.me = {};
    $scope.regions = [];

    var apiEmploye = $resource('/api/employe');
    var apiCarType = $resource('/api/car_types');
    var apiNews = $resource('/api/news');

    $scope.newsTable = new ngTableParams({
        page: 1,
        count: 20,
        sorting: {
            _id: 'asc'
        },
        query: {
            region: ''
        }
    }, {
        total: 0,
        getData: function($defer, params) {
            apiNews.get(params.url(), function(data) {
                    params.total(data.total);
                    $defer.resolve(data.result);
            });
        }
    });
    $scope.adminsTable = new ngTableParams({
        page: 1,
        count: 10,
        sorting: {
            _id: 'asc'
        },
        query: {
            type: 3
        }
    }, {
        total: 0,
        getData: function($defer, params) {
            apiEmploye.get(params.url(), function(data) {
                    params.total(data.total);
                    $defer.resolve(data.result);
            });
        }
    });
    $scope.personalTable = new ngTableParams({
        page: 1,
        count: 25,
        sorting: {
            _id: 'asc'
        },
        query: {
            'type': '1_2'
        }
    }, {
        total: 0,
        groupBy: 'type',
        getData: function($defer, params) {
            apiEmploye.get(params.url(), function(data) {
                    params.total(data.total);
                    $defer.resolve(data.result);
            });
        }
    });
    $scope.taxiTable = new ngTableParams({
        page: 1,
        count: 10,
        sorting: {
            _id: 'asc'
        },
        query: {
            'type': 4
        }
    }, {
        total: 0,
        getData: function($defer, params) {
            apiEmploye.get(params.url(), function(data) {
                params.total(data.total);
                $defer.resolve(data.result);
            });
        }
    });
    $scope.cartypeTable = new ngTableParams({
        page: 1,
        count: 10,
        sorting: {
            _id: 'asc'
        },
        filter: {}
    }, {
        total: 0,
        getData: function($defer, params) {
            apiCarType.get(params.url(), function(data) {
                params.total(data.total);
                $defer.resolve(data.result);
            });
        }
    });

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

        if(!page) page = 'personal';
        $scope.curPage = page;
        $scope.template = 'templates/admin/' + page + '.html';
        return true;
    }

    $('body').on('click', 'a.page-link', function(){
        var url = $(this).attr('href');
        $scope.loadPage(url);
        $scope.$apply();
        return false;
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

                $http.get('/api/regions').success(function(regions){
                    $scope.regions = regions;
                    $scope.activeRegion = regions[0];
                });

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


    // ****************** ADMINS **********************

    $scope.adminsAddOpen = function(){
        $scope.modalForm = {};
        $('#adminsAddModal').modal({});
    }
    $scope.adminsAdd = function(user){

        user.type = 3;

        $http.post('/api/employe', user).success(function(result){

            if(result.error) {
                alert(result.error);
                return;
            }

            $scope.adminsTable.reload();
            $('#adminsAddModal').modal('hide');

        });

    }
    $scope.adminsEdit = function(user){
        if(user.pass) user.pass = hex_md5(user.pass);
        $http.put('/api/employe/' + user._id, user).success(function(result){

            $scope.modalForm = {};
            $('#adminsEditModal').modal('hide');

        });
    }
    $scope.adminsDel = function(user){
        if(confirm('Вы действительно хотите удалить ' + user.name)){

            $http.delete('/api/employe/' + user._id).success(function(result){
                if(result.error) {
                    alert(result.error);
                }
                $scope.adminsTable.reload();
            });

        }
    }
    $scope.adminsEditOpen = function(user){
        $scope.modalForm = user;
        $('#adminsEditModal').modal({});
    }
    $scope.register = function(user){

        console.log(user);

        user.pass = hex_md5(user.pass);

        $http.put('/api/employe/password/' + user.user_id, user).success(function(result){
            if(result.error) {
                alert(result.error);
            } else {

                location.href = '/admin.html';

            }
        });

    }

    // ****************** NEWS **********************

    $scope.newsAddOpen = function(){
        $scope.modalForm = {};
        $('#newsAddModal').modal({});
    }
    $scope.newsAdd = function(item){

        $http.post('/api/news', item).success(function(result){

            if(result.error)
                return alert(result.error);

            $scope.newsTable.reload();
            $('#newsAddModal').modal('hide');

        });

    }
    $scope.newsEdit = function(item){


        $http.put('/api/news/' + item._id, item).success(function(result){

            $scope.modalForm = {};
            $('#newsEditModal').modal('hide');

        });
    }
    $scope.newsDel = function(item){
        if(confirm('Вы действительно хотите удалить ' + item.title)){

            $http.delete('/api/news/' + item._id).success(function(result){
                if(result.error)
                    return alert(result.error);

                $scope.newsTable.reload();
            });

        }
    }
    $scope.newsEditOpen = function(item){
        $scope.modalForm = item;
        $('#newsEditModal').modal({});
    }
    $scope.regionIdToName = function(id){
        var list = _.indexBy($scope.regions, '_id');
        return list[id] ? list[id].name : 'не определено';
    }


    // **************** PERSONAL *******************

    $scope.personalAddOpen = function(type){

        $scope.modalForm = {
            type: type
        };

        $('#personalAddModal').modal({});

    }
    $scope.personalAdd = function(user){

        if(user.pass) user.pass = hex_md5(user.pass);

        $http.post('/api/employe', user).success(function(result){

            if(result.error) {
                alert(result.error);
                return;
            }

            $scope.personalTable.reload();
            $('#personalAddModal').modal('hide');
            console.log(result);
        });

    }
    $scope.personalDel = function(user){

        if(confirm('Вы действительно хотите удалить ' + user.name)){

            $http.delete('/api/employe/' + user._id).success(function(result){
                if(result.error) {
                    alert(result.error);
                }
                $scope.personalTable.reload();
            });

        }

    }
    $scope.personalEditOpen = function(user){
        $scope.modalForm = user;
        $('#personalEditModal').modal({});
    }
    $scope.personalEdit = function(user){

        if(user.pass) user.pass = hex_md5(user.pass);

        $http.put('/api/employe/' + user._id, user).success(function(result){

            $scope.modalForm = {};
            $('#personalEditModal').modal('hide');

        });

    }

    // ****************** TAXI *********************

    $scope.taxiAddOpen = function(){
        $scope.modalForm = {};
        $('#taxiAddModal').modal({});
    }
    $scope.taxiAdd = function(user){

        user.type = 4;
        user.pass = hex_md5(user.pass);
        user.active = true;

        $http.post('/api/employe', user).success(function(result){

            if(result.error) {
                alert(result.error);
                return;
            }

            $scope.taxiTable.reload();
            $('#taxiAddModal').modal('hide');

        });

    }
    $scope.taxiEdit = function(user){

        if(user.pass) user.pass = hex_md5(user.pass);

        $http.put('/api/employe/' + user._id, user).success(function(result){

            $scope.modalForm = {};
            $('#taxiEditModal').modal('hide');

        });

    }
    $scope.taxiDel = function(user){

        if(confirm('Вы действительно хотите удалить ' + user.name)){

            $http.delete('/api/employe/' + user._id).success(function(result){
                if(result.error) {
                    alert(result.error);
                }
                $scope.taxiTable.reload();
            });

        }

    }
    $scope.taxiEditOpen = function(user){
        $scope.modalForm = user;
        $('#taxiEditModal').modal({});
    }


    // *************** ORDER OPTIONS ******************


    $scope.addOrderOptionShow = function(){
        $scope.modalForm = {
            title: '',
            type: 'checkbox',
            data: {
                'true': 10,
                'false': 0,
                min: 0,
                max: 100,
                step: 1
            },
            list: []
        };
        $('#newOptionModal').modal({});
    }

    $scope.newOrderOption = function(option, region){

        if(!option.title)
            return alert('Не указано название опции');

        var data, list = option.list;

        if(option.type == 'checkbox') {

            data = {
                'true': option.data.true,
                'false': option.data.false
            };
            list = [];

        } else if(option.type == 'number') {

            data = {
                min: option.data.min,
                max: option.data.max,
                step: option.data.step,
                unit: option.data.unit,
                price: option.data.price
            };
            list = [];

        } else if(option.type == 'list') {
            data = {};
        }

        $http.post('/api/order_option/' + region._id, {
            title: option.title,
            type: option.type,
            region: region._id,
            data: data,
            list: list
        }).success(function(result){
            $scope.orderOptions.push(result);
            $('#newOptionModal').modal('hide');
        });

    }

    $scope.editOrderOption = function(option){

        if(!option.title)
            return alert('Не указано название опции');

        var data, list = option.list;

        if(option.type == 'checkbox') {

            data = {
                'true': option.data.true,
                'false': option.data.false
            };
            list = [];

        } else if(option.type == 'number') {

            data = {
                min: option.data.min,
                max: option.data.max,
                step: option.data.step,
                unit: option.data.unit,
                price: option.data.price
            };
            list = [];

        } else if(option.type == 'list') {
            data = {};
        }

        $http.put('/api/order_option/' + option._id, {
            title: option.title,
            type: option.type,
            data: data,
            list: list
        }).success(function(result){
            $('#newOptionModal').modal('hide');
        });

    }

    $scope.calcOptionPrice = function(option){

        if(option.type == 'checkbox') {

            return option.value ? option.data.true : option.data.false;

        } else if(option.type == 'number') {

            return option.data.price * option.value;

        } else if(option.type == 'list') {

            return option.value;

        }

    }

    $scope.removeOrderOption = function(ind, option){
        $http.delete('/api/order_option/' + option._id).success(function(result){
            if(result.error)
                return alert(result.error);
            $scope.orderOptions.splice(ind, 1);
        });
    }

    $scope.editOrderOptionShow = function(option){
        $scope.modalForm = option;
        $('#newOptionModal').modal({});
    }





    // *************** REGIONS ******************


    $scope.map = {
        center: [56.837095205885184, 60.6040620803833],
        zoom: 10
    };

    ymapsLoader.ready(function(ym){
        ymaps = ym;
    });

    $scope.newRegion = function(name){

        if(name) {

            getPositionByAddressYa('Россия, ' + name, function(res){
                if(res) {

                    var pos = res.pos;
                    var Envelope = res.details.boundedBy.Envelope;
                    var c1 = Envelope.lowerCorner.split(' ');
                    var c2 = Envelope.upperCorner.split(' ');
                    var bounding = [[parseFloat(c1[1]), parseFloat(c1[0])], [parseFloat(c2[1]), parseFloat(c2[0])]];
                    var data = {
                        name: res.details.name,
                        pos: pos,
                        bounding: bounding,
                        code: res.code,
                        country: res.country,
                        province: res.province
                    }

                    console.log(data);


                    $http.post('/api/region', data).success(function(region){
                        console.log(region);
                        if(region.error) {
                            alert(region.error);
                        } else {
                            $scope.regions.push(region);
                        }
                    });

                    globMap.setCenter([pos.lat, pos.lng]);
                    boundBox.geometry.setCoordinates(bounding);

                    $scope.newRegionName = '';

                    $('#newRegionModal').modal('hide');
                } else {
                    alert('Указанный регион не найден');
                }
            });


        } else {
            alert('Нужно ввести название');
        }

    }
    $scope.openRegionPage = function(){

        if(!boundBox) setTimeout(function() {

            boundBox = new ymaps.Rectangle([[0, 0], [1, 1]], {}, {
                fill: false,
                coordRendering: "boundsPath",
                strokeWidth: 4,
                draggable: false
            });

            globMap.geoObjects.add(boundBox);

        }, 500);

        $http.get('/api/cars/brands').success(function(brands){
            $scope.brands = brands;
            $scope.activeBrand = brands[0];
        });

    }
    $scope.selectRegion = function(region){

        var pos = region.pos;

        globMap.setCenter([pos.lat, pos.lng]);
        boundBox.geometry.setCoordinates(region.bounding);


        $http.get('/api/tarifclass/' + region._id).success(function(tarifs){
            $scope.regTarifs = tarifs;
            $scope.activeTarif = tarifs[0];
        });

        $http.get('/api/order_options/' + region._id).success(function(options){
            $scope.orderOptions = options;
        });

        $scope.carModels = [];
        $scope.activeRegion = region;
        $scope.activeRegion.phonesStr = region.phones.join(',');

        $scope.cartypeTable.filter({region: region._id});


    }
    $scope.selectTarif = function(tarif){
        $scope.activeTarif = tarif;
    }
    $scope.saveTarif = function(tarif){
        $scope.indicator1 = true;
        $http.put('/api/region/tarif', tarif).success(function(res){
            $scope.indicator1 = false;
        });
    }
    $scope.savePhones = function(region){
        $scope.indicator2 = true;

        var data = {
            _id: region._id,
            phones: region.phonesStr.split(','),
            default_fee: region.default_fee,
            timezone: region.timezone
        }

        $http.put('/api/region', data).success(function(res){
            $scope.indicator2 = false;
        });
    }

    $scope.setTarifModel = function(model){

        var data = {
            model: model._id,
            tarif: model.tarif,
            region: $scope.activeRegion._id
        }

        $http.post('/api/region/tarifmodel', data).success(function(res){
            console.log(res);
        });

    }

    $scope.selectBrand = function(code){

        $http.get('/api/region/models/' + code + '/' + $scope.activeRegion._id).success(function(res){
            console.log(res);
            $scope.carModels = res;
        });

    }
    $scope.cartypeAddOpen = function(){
        $scope.modalForm = {};
        $('#cartypeAddModal').modal({});
    }
    $scope.cartypeAdd = function(form){

        form.region = $scope.activeRegion._id;
        $http.post('/api/car_types', form).success(function(result){

            if(result.error) {
                alert(result.error);
                return;
            }

            $scope.cartypeTable.reload();
            $('#cartypeAddModal').modal('hide');

        });


    }
    $scope.saveCartype = function(ctype){

        $http.put('/api/car_types/' + ctype._id, ctype).success(function(result){

            if(result.error) {
                alert(result.error);
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

    $scope.addSatellite = function(name, region){
        if(!region.satellites) region.satellites = [];
        region.satellites.push(name);

        $http.put('/api/region', {
            _id: region._id,
            satellites: region.satellites
        }).success(function(res){ });

    }
    $scope.delSatellite = function(index, region){
        region.satellites.splice(index, 1);

        $http.put('/api/region', {
            _id: region._id,
            satellites: region.satellites
        }).success(function(res){ });

    }



    // ***************** INIT **************************

    urlParams = location.hash.split('/').splice(1);
    if(urlParams[0] == 'register' && urlParams[1]) {
        $scope.modalForm.user_id = urlParams[1];
        $scope.modalForm.user_name = decodeURI(urlParams[2]);
        $scope.modalForm.company_name = decodeURI(urlParams[3]);
        $scope.modalForm.invite = urlParams[4];

        $scope.loadPage('#/register');

    } else {

        $scope.login();



    }



});
app.directive('loadingContainer', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var loadingLayer = angular.element('<div class="loading"></div>');
            element.append(loadingLayer);
            element.addClass('loading-container');
            scope.$watch(attrs.loadingContainer, function(value) {
                loadingLayer.toggleClass('ng-hide', !value);
            });
        }
    };
});


////////


function getPositionByAddressYa(addr, callback){
    var q = addr.replace(/ /g, '+');
    $.get('http://geocode-maps.yandex.ru/1.x/?geocode=' + q + '&results=1&format=json', function(data){

        var code = hex_md5(JSON.stringify(data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty));
        var p = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
        var descr = data.response.GeoObjectCollection.featureMember[0].GeoObject;
        var country = descr.metaDataProperty.GeocoderMetaData.AddressDetails.Country.CountryNameCode;
        var province = descr.metaDataProperty.GeocoderMetaData.AddressDetails.Country.AdministrativeArea.AdministrativeAreaName;

        if(p) {
            p = p.split(" ");
            var point = {
                lat: parseFloat(p[1]),
                lng: parseFloat(p[0])
            }
            callback({
                pos: point,
                details: descr,
                code: code,
                country: country,
                province: province
            })
        } else {
            callback(false);
        }
    })
}
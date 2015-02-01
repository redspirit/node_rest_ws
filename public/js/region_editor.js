/**
 * Created by aleksej on 20.11.14.
 */



var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
}
var map, boundBox;

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){

    $scope.regions = [];
    $scope.regTarifs = [];
    $scope.carModels = [];
    $scope.brands = [];
    $scope.indicator1 = false;
    $scope.indicator2 = false;





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
                        country: res.country
                    }


                    $http.post('/api/region', data).success(function(region){
                        if(region.error) {
                            alert(region.error);
                        } else {
                            $scope.regions.push(region);
                        }
                    });

                    map.setCenter([pos.lat, pos.lng]);
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

    $scope.selectRegion = function(region){

        var pos = region.pos;

        map.setCenter([pos.lat, pos.lng]);
        boundBox.geometry.setCoordinates(region.bounding);


        $http.get('/api/tarifclass/' + region._id).success(function(tarifs){

            $scope.regTarifs = tarifs;
            $scope.activeTarif = tarifs[0];

        });

        $scope.carModels = [];
        $scope.activeRegion = region;
        $scope.activeRegion.phonesStr = region.phones.join(',');

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

    $scope.saveRegion = function(region){
        $scope.indicator2 = true;

        console.log(region);

        var data = {
            _id: region._id,
            phones: region.phonesStr.split(','),
            commission: region.commission
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

    $http.get('/api/regions').success(function(regions){
        $scope.regions = regions;
        $scope.activeRegion = regions[0];
    });

    $http.get('/api/cars/brands').success(function(brands){
        $scope.brands = brands;
        $scope.activeBrand = brands[0];
    });

    /*
     var isInited = false;
     $scope.initFirstRegion = function(first, region){
     if(first && !isInited) {
     isInited = true;
     $scope.selectRegion(region);
     }
     }
     */

});

ymaps.ready(function(){


    map = new ymaps.Map("home", {
        center: [56.837095205885184, 60.6040620803833],
        zoom: 10,
        coordorder:'latlong',
        controls: ["zoomControl"]
    });

    boundBox = new ymaps.Rectangle([[30, 50], [31, 51]], {}, {
        fill: false,
        coordRendering: "boundsPath",
        strokeWidth: 4,
        draggable: false
    });

    map.geoObjects.add(boundBox);
});

function getPositionByAddressYa(addr, callback){
    var q = addr.replace(/ /g, '+');
    $.get('http://geocode-maps.yandex.ru/1.x/?geocode=' + q + '&results=1&format=json', function(data){

        var code = hex_md5(JSON.stringify(data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty));
        var p = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
        var descr = data.response.GeoObjectCollection.featureMember[0].GeoObject;
        var country = data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.AddressDetails.Country.CountryNameCode;

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
                country: country
            })
        } else {
            callback(false);
        }
    })
}
var config = {
    server: 'http://46.254.19.232:8010',
    clientId: 'web',
    clientSecret : '1234'
}

var app = angular.module('App', []);
app.controller('MainCtrl', function($scope, $http){

    $scope.findedImages = [];
    $scope.carBrands = [];
    $scope.carModels = [];
    $scope.allClasses = [];
    $scope.findedCars = [];
    $scope.car = {};
    $scope.new_car = {};
    $scope.subClasses = [
        { name: 'Супер бюджет', value: 4 },
        { name: 'Бюджетный', value: 1 },
        { name: 'Средний', value: 2 },
        { name: 'Премиум', value: 3 }
    ];

    $scope.to_page = function(page){
        $scope.template = 'templates/car/' + page + '.html';
        $scope.operation_success = '';
    }


    $scope.to_page('assign');


    $http.get('/api/cars/brands').success(function(res){
        for(var i in res) {
            $scope.carBrands.push({name: res[i].name, value: res[i].code});
        }
        $scope.brand = res[0].code;
    });

    $http.get('/api/cars/class').success(function(res){
        $scope.allClasses = res;
    });

    // ==================

    $scope.selectBrand = function(brand){
        $http.get('/api/cars/models/' + brand).success(function(res){
            var doneFlag = '';
            $scope.carModels = [];
            for(var i in res) {

                if(res[i].class && res[i].subclass && res[i].image_url) {
                    doneFlag = '';
                    //doneFlag = ' *';
                } else {
                    doneFlag = '';
                }

                $scope.carModels.push({name: res[i].model + doneFlag, value: res[i].model});
            }
            $scope.model = res[0].model;
            $scope.selectCar(brand, res[0].model);
        });
    }

    $scope.selectCar = function(m1, m2){

        $http.get('/api/cars/info/' + m1 + '/' + m2).success(function(car){

            $scope.car = car;
            $scope.findedImages = [];
            m1 = car.brand_name;

        });

    }

    $scope.addClass = function(code, descr){

        $http.post('/api/cars/class', {code: code, descr: descr}).success(function(res){
            $scope.allClasses.push(res);
        });

    }

    $scope.deleteClass = function(code){
        $http.delete('/api/cars/class/' + code).success(function(res){
            $http.get('/api/cars/class').success(function(res){
                $scope.allClasses = res;
            });
        });
    }


    $scope.saveCar = function(car){

        $http.put('/api/cars/save', car).success(function(res){
            $('.save-indicator').css('opacity', '1').animate({opacity: 0}, 2000);
        });

    }

    $scope.addCarPage = function(){

        $scope.to_page('add');

        $scope.new_car.brand_code = $scope.car.brand_code;
        $scope.new_car.brand_name = $scope.car.brand_name;

    }

    $scope.createCar = function(car){

        $http.post('/api/cars', car).success(function(res){
            $('.save-indicator').css('opacity', '1').animate({opacity: 0}, 2000);
            $scope.carModels.push({name: res.model, value: res.model});
        });

    }

    $scope.removeCar = function(car){

        $http.delete('/api/cars/' + car._id).success(function(res){

            $scope.selectBrand(res.brand_code);

        });

    }

    $scope.findCars = function(){

        $http.get('/api/cars/table/30').success(function(cars){

            $scope.findedCars = cars.models;
            $scope.tableCarClass = $scope.allClasses[0];
            $scope.tableCarSubClass = $scope.subClasses[0];

            $scope.totalCars = cars.total;
            $scope.processedCars = cars.total - cars.notproc;
            $scope.elapsedCars = cars.notproc;

        });

        $scope.findedPics = [];

    }

    $scope.changeClass = function(carClass){
        for(var i in $scope.findedCars) {
            $scope.findedCars[i].checked = ($scope.findedCars[i].class == carClass);
        }
    }
    $scope.changeSubClass = function(carSubClass){

        for(var i in $scope.findedCars) {
            $scope.findedCars[i].checked2 = ($scope.findedCars[i].subclass == carSubClass);
        }
    }

    $scope.checkCar = function(car, cls){

        if(!car.checked) {
            car.class = cls;
        } else {
            car.class = '';
        }

    }

    $scope.checkCar2 = function(car, cls){

        console.log();

        if(!car.checked2) {
            car.subclass = cls;
        } else {
            car.subclass = 0;
        }

    }

    $scope.getClassDescr = function(cls){

        for(var i in $scope.allClasses){
            if($scope.allClasses[i].code == cls) return $scope.allClasses[i].descr;
        }

    }

    $scope.getSubClassName = function(cls){

        if(!cls){
            return '';
        }

        for(var i in $scope.subClasses){
            if($scope.subClasses[i].value == cls) return $scope.subClasses[i].name;
        }

    }

    $scope.saveTable = function(findedCars){

        $http.put('/api/cars/save', findedCars).success(function(res){
            $('.save-indicator').css('opacity', '1').animate({opacity: 0}, 2000);

            $scope.findCars();

        });

    }

    $scope.selectImage = function(pic, selectedCar){

        for(var i in $scope.findedCars) {
            if($scope.findedCars[i]._id == selectedCar) {
                $scope.findedCars[i].image_url = pic;
                return;
            }
        }

    }

    $scope.infoSelectPic = function(pic){

        $scope.saveCar($scope.car);
        $scope.car.image_url = pic;

    }

    $scope.tagClick = function(car, val){
        $scope.car.subclass = val;
        $scope.saveCar($scope.car);
    }

    $scope.tagClick2 = function(car, val){
        $scope.car.class = val;
        $scope.saveCar($scope.car);
    }


    $scope.forceFindPhotos2 = function (car) {

        var m1 = car.brand_name;
        var m2 = car.model;
        $scope.showSpinner = true;

        $http.get('/api/cars/search/automail/' + m1 + '+' + m2).success(function (info) {

            $scope.findedImages = info.images;

            if (info.class) {
                car.class = info.class;
            }

            $scope.showSpinner = false;

        });

    }


    $scope.forceFindPhotos1 = function (car) {

        var m1 = car.brand_name;
        var m2 = car.model;
        $scope.showSpinner = true;

        $http.get('/api/cars/search/yandex/' + m1 + '+' + m2).success(function (res) {
            $scope.findedImages = res;
            $scope.showSpinner = false;
        });

    }

    $scope.forceFindPhotos3 = function (car) {

        var m1 = car.brand_name;
        var m2 = car.model;
        $scope.showSpinner = true;

        $http.get('/api/cars/search/autowp/' + m1 + '+' + m2).success(function (res) {
            $scope.findedImages = res;
            $scope.showSpinner = false;
        });

    }

    $scope.modelSearch = function(car){

        var brand = car.brand_name;
        var model = car.model;

        $scope.selectedCar = car._id;

        /*
        $http.post('/api/cars/marksearch', {brand: brand, model: model}).success(function(info){

            if(info.images.length) {

                $scope.findedPics = info.images;
                $scope.findedClass = info.class;

                if(info.class) {
                    car.class = info.class;
                }

            } else {

                $http.post('/api/cars/search', {q: brand + ' ' + model}).success(function(res){
                    $scope.findedClass = 'Фото из поисковика';
                    $scope.findedPics = res;
                });

            }

        });
        */


    }

    $(document).on('mouseover', '.prev-image', function(){
        var url = $(this).attr('image');
        var offset = $(this).offset();
        $('.popup-image img').attr('src', url);
        $('.popup-image').css({left: (offset.left - 190) + 'px', top: (offset.top - 150) + 'px'}).show();

    }).on('mouseleave', '.prev-image', function(){
        $('.popup-image').hide();
    });

});








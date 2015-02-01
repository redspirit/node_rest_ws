/**
 * Created by aleksej on 21.11.14.
 */

var config = {
    server: location.host,
    clientId: 'web',
    clientSecret : '1234'
};


var app = angular.module('App', ['mgcrea.ngStrap']);
app.controller('MainCtrl', function($scope, $http, ws){

    var user_id;
    MicroEvent.mixin(ws);

    $scope.order = {
        option: [],
        status: 0,
        distance: 0,
        is_delayed: false
    };
    $scope.showConfirmForm = false;
    $scope.orderAdresses = [{name: ''}];





    // FOMRS


    $scope.login = function(form){

        $http.get('/api/employe/login').success(function(res){
            if(res.error) {
                location.href = '/';
            } else {
                console.log('ME', res);
                $scope.me = res;
                ws.connect(res.session);
            }
        });


    };
    $scope.logout = function(){

        $http.get('/api/employe/logout').success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {
                location.href = '/';
            }
        });

    };


    $scope.createOrder = function(user, order){             // * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

        console.log('отправляемые адреса', $scope.orderAdresses);

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


        if(!order.tarif_class) {
            alert('Надо указать подразделение заказа');
            return false;
        }

        var points = [];
        $scope.orderAdresses.forEach(function(point){
            if(point.lat) points.push({
                name: point.name,
                lat: point.lat,
                lon: point.lon,
                city: point.city
            });
        });


        // проверяем, нужно ли создать пользователя
        if($scope.callUser._id == 'new') {

            $http.post('/api/dispatcher/user', $scope.callUser).success(function(res){
                if(res.error) {
                    console.log(res.error);
                } else {

                    $scope.callUser = res;

                    console.log('Клиент создан', res);


                    ws.socket.emit('order:create:disp', {
                        points: points,
                        dispatcher: true,
                        user: {
                            _id: $scope.callUser._id,
                            name: $scope.callUser.name
                        },
                        option: $scope.callOptions,
                        date: order.is_delayed ? moment(order.date).format() : '',
                        calls: [
                            $scope.call._id
                        ],
                        tarif_class: order.tarif_class
                    }, function(data){
                        if(data.error) {
                            alert(data.error);
                        } else {

                            console.log('order', data);

                            $scope.cancelOrder();
                            $scope.$apply();
                        }
                    });



                }
            });

        } else {


            ws.socket.emit('order:create:disp', {
                points: points,
                dispatcher: true,
                user: {
                    _id: $scope.callUser._id,
                    name: $scope.callUser.name
                },
                option: $scope.callOptions,
                date: order.is_delayed ? moment(order.date).format() : '',
                calls: [
                    $scope.call._id
                ],
                tarif_class: order.tarif_class
            }, function(data){
                if(data.error) {
                    alert(data.error);
                } else {

                    console.log('order', data);

                    $scope.cancelOrder();
                    $scope.$apply();
                }
            });

            if($scope.callUser.edited) updateClientPhone();

        }

    };

    $scope.manualCreateOrder = function(){

        $scope.callUser = {
            _id: 'new',
            phone: '',
            isNew: true,
            name: ''
        };
        $scope.call = {};
        $scope.callTarifs = [];

        $scope.order = {
            option: [],
            status: 0,
            distance: 0,
            is_delayed: false
        };
        $scope.showConfirmForm = false;
        $scope.orderAdresses = [{name: '', city: '', isFocus: true}];


        /*
        $http.get('/api/region/' + $scope.default_region).success(function(regionDetail){
            if(regionDetail.error) {
                alert(regionDetail.error);
            } else {
                $scope.region = regionDetail;
                $scope.callTarifs = regionDetail.tarifs;
                $scope.orderAdresses[0].city = regionDetail.name;

                $scope.region.citys = _.union([regionDetail.name], $scope.region.satellites);

            }
        });
*/

    }

    $scope.updateOrder = function(user, order){

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
            if(point.lat) points.push({
                name: point.name,
                lat: point.lat,
                lon: point.lon
            });
        });

        ws.socket.emit('order:update:disp', {
            _id: order._id,
            points: points,
            dispatcher: true,
            user: {
                _id: $scope.callUser._id,
                name: $scope.callUser.name
            },
            option: $scope.callOptions,
            date: order.is_delayed ? moment(order.date).format() : '',
            tarif_class: order.tarif_class
        }, function(data){
            if(data.error) {
                alert(data.error);
            } else {

                console.log('order', data);


                // сохраняем новый номер телефона клиенту
                if($scope.callUser.edited) updateClientPhone();


                $scope.cancelOrder();
                $scope.$apply();
            }
        });

    };

    $scope.dispatchOrder = function(order){

        ws.socket.emit('order:cancel:disp', {_id: order._id}, function(data){
            if(data.error) {
                alert(data.error);
            } else {
                console.log('Заказ был отменен');
                $scope.cancelOrder();
                $scope.$apply();
            }
        });

    };


    $scope.cancelOrder = function(){

        $scope.order = {
            option: [],
            status: 0,
            distance: 0,
            is_delayed: false
        };
        $scope.orderAdresses = [{name: ''}];

        $scope.callUser = {};
        $scope.call = {};
        $scope.callTarifs = [];

        ws.socket.emit('order:cancel:disp', {_id: ''}, function(data){

        });

    };

    $scope.setCurrentTime = function(){
        $scope.order.date = new Date();
    };

    $scope.addAddress = function(addr, e, ind){
        if (e.keyCode == 13) {

            if(addr.name && !addr.lat) {

                console.log('Запрос координат', $scope.region.province + ', ' + addr.city + ', ' + addr.name);

                ws.socket.emit('geo:position', {address: $scope.region.province + ', ' + addr.city + ', ' + addr.name}, function(res) {
                    if(res.error) {
                        console.log('GEOPOS ERROR', addr.name, res.error);
                        addr.lat = null;
                        addr.lon = null;
                    } else {

                        res = res[0];

                        addr.lat = res.lat;
                        addr.lon = res.lon;
                        addr.name =  res.name;


                        var p1 = $scope.orderAdresses[0];
                        var p2 = $scope.orderAdresses[$scope.orderAdresses.length - 1];

                        if(p1.lat && p2.lat && $scope.orderAdresses.length > 1) {

                            console.log('Запрос пути');

                            ws.socket.emit('route:points', $scope.orderAdresses, function(points){

                                //map.setRoute(points.path);
                                $scope.order.distance = (points.distance / 1000).toFixed(1);

                                console.log('Запрос пути', points.distance);

                                var priceQuery = {
                                    region: $scope.call.region || $scope.region.code,             // region code
                                    tarif_class: $scope.order.tarif_class,
                                    distance: points.distance
                                }

                                $http.get('/api/region/average_price?' + $.param(priceQuery)).success(function(res){
                                    if(res.error) {
                                        console.log(res.error);
                                    } else {

                                        console.log('Запрошенная цена', res);
                                        $scope.averagePrice = res;

                                    }
                                });

                                $scope.$apply();

                            });

                        }

                    }
                    $scope.$apply();
                });

            }


            //console.log($scope.orderAdresses);

            if(addr.lat && $scope.orderAdresses.length - 1 == ind) {
                $scope.orderAdresses.push({
                    name: '',
                    isFocus: true,
                    city: $scope.region.name
                });
            }


        }
    };
    $scope.forClearAddr = function(addr, e){

        if(e.keyCode == 8 && !addr.name) {
            addr.lat = null;
            addr.lon = null;
        }

    }
    $scope.removeAddr = function(i){
        $scope.orderAdresses.splice(i, 1);
    };

    $scope.focusThis = function(ind, addrs){
        return addrs.length - 1 == ind;
    }


    $scope.onDropComplete = function (index, obj, evt) {
        var otherObj = $scope.orderAdresses[index];
        var otherIndex = $scope.orderAdresses.indexOf(obj);
        $scope.orderAdresses[index] = obj;
        $scope.orderAdresses[otherIndex] = otherObj;
    }

    $scope.setNow = function(val){
        $scope.order.is_delayed = val;

    };
    $scope.makeOrderMap = function(){
        setTimeout(function(){
            //map.createMap();
        }, 1000);
    };
    $scope.formatPhone = function(phone){
        if(phone) {
            var p = phone.substr(-10);
            var code = p.substr(0, 3);
            return '+7(' + code + ')' +  p.substr(-7);
        } else {
            return '';
        }
    };
    $scope.getAge =  function(time){
        if(!time) return 'не указано';
        time = new Date(time).getTime();
        var birth = new Date(time);
        var year = birth.getFullYear();
        var today = new Date();
        return today.getFullYear() - year - (today.getTime() < birth.setFullYear(year)) ;
    };
    $scope.selectCallTarif =  function(tarif){
        $scope.order.tarif_class = tarif;
    };
    $scope.colorRow =  function(status){
        var cls, result = {};
        if(status == 1) {
            cls = 'lightgreen-label';
        } else if(status >= 2 && status <= 4) {
            cls = 'green-label';
        } else if (status == 5) {
            cls = 'white-label';
        } else {
            cls = 'red-label';
        }
        result[cls] = true;
        return result;
    };
    $scope.fillOrder =  function(orders){


        orders.forEach(function(order){

            if(order.status <= 2) {

                console.log('full order', order);

                $scope.order = order;
                $scope.order.isOld = true;
                $scope.orderAdresses = order.points;

            }

        });

    };

    $scope.openRecord =  function(link){
        var params = 'scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=400,height=200';
        window.open('/callrecord?link=' + encodeURIComponent(link), 'callRecord', params);
    };

    $scope.calcOptionPrice = function(option){
        if(option.type == 'checkbox') {
            return option.value ? option.data.true : option.data.false;
        } else if(option.type == 'number') {
            return option.data.price * option.value;
        } else if(option.type == 'list') {
            return option.value;
        }
    }

    $scope.calcOptionPriceAll = function(options, add){

        if(!add)
            return 'для расчета нужно указать адреса заказа';

        var sum = add;
        options.forEach(function(opt){
            var v = $scope.calcOptionPrice(opt);
            sum += v ? v : 0;
        });

        return sum;

    }


    /////// WEBSOCKET

    ws.on('disconnect', function(res){

        console.log('Дисконнект сокета!');

    });

    ws.on('ready', function(res){

        console.log('ready', res);

        $scope.default_region = res.default_region;

        if(res.call && res.callUser) {

            $scope.call = res.call;
            $scope.callUser = res.callUser;
            $scope.callTarifs = res.callTarifs;
            $scope.callOptions = res.callOptions;
            $scope.region = res.call.region_id;


            $scope.orderAdresses[0].city = $scope.region.name;
            $scope.region.citys = _.union([$scope.region.name], $scope.region.satellites);


            $http.get('/api/dispatcher/orders/' + $scope.callUser._id).success(function(orders){
                if(orders.error) {
                    alert(orders.error);
                } else {
                    $scope.callUser.orders = orders;
                    $scope.fillOrder(orders);
                }
            });

        }

    });

    ws.on('call:start', function(res){

        console.log('call:start', res);

        $scope.call = res.call;
        $scope.callUser = res.user;
        $scope.callTarifs = res.tarifs;
        $scope.callOptions = res.options;

        $scope.region = res.call.region_id;

        $scope.orderAdresses[0].city = $scope.region.name;
        $scope.region.citys = _.union([$scope.region.name], $scope.region.satellites);

        /*
        $http.get('/api/region/' + res.call.region_id).success(function(regionDetail){
            if(regionDetail.error) {
                alert(regionDetail.error);
            } else {
                $scope.region = regionDetail;
            }
        });
    */

        $http.get('/api/dispatcher/orders/' + res.user._id).success(function(orders){
            if(orders.error) {
                alert(orders.error);
            } else {

                console.log(orders);
                $scope.callUser.orders = orders;
                $scope.fillOrder(orders);

            }
        });

        //$scope.loadPage('#/create');
        $scope.$apply();

    });

    ws.on('call:end', function(res){

        //localStorage.removeItem('call');
        //localStorage.removeItem('callUser');

        console.log('call:end', res);

    });


    $scope.takeDate = function(str){
        var d = new Date(str);
        return d.valueOf();
    }


    function updateClientPhone(){

        $http.put('/api/dispatcher/user/' + $scope.callUser._id, {phone: $scope.callUser.phone}).success(function(res){
            if(res.error) {
                console.log(res.error);
            } else {

                console.log('Клиент отредактрован', res);

            }
        });

    }


    // INIT ***********************

    $scope.login();

    // проверяем, есть ли у нас активный звонок



});


app.service('ws', function($http){

    var self = this;
    var connected = false;


    this.connect = function(session) {


        console.log('init socket connect');

        var params = {
            session: session,
            type: 'employe'
        };


        self.socket = io.connect('ws://' + config.server + '?' + $.param(params));
        connected = true;

        self.socket.on('disconnect', function(res){ self.trigger('disconnect', res); });
        self.socket.on('ready', function(res){ self.trigger('ready', res); });
        self.socket.on('call:start', function(res){ self.trigger('call:start', res); });
        self.socket.on('call:end', function(res){ self.trigger('call:end', res); });

    }

    this.findAddress = function(addr, callback){

        self.socket.emit('geo:position', {address: addr}, function(res){
            if(res.error) {
                console.log('findAddress error', res.error);
            } else {
                callback(res);
            }
        });

    }

});

app.service('map', function(){

    var map, myWay, group;

    this.createMap = function() {

        $('#map').empty();
        map = new ymaps.Map("map", {
            center: [56.8244397, 60.595625],
            zoom: 14,
            coordorder:'latlong',
            controls: ["zoomControl"]
        });

        group = new ymaps.GeoObjectCollection();

        myWay = new ymaps.Polyline([], {}, {
            strokeColor: '#0000ff',
            strokeWidth: 4,
            strokeOpacity: 0.7
        });
        map.geoObjects.add(myWay);
        map.geoObjects.add(group);

    };

    this.addMarker = function(pos){

        if(!pos) {
            return;
        }

        var mark = new ymaps.Placemark([pos.lat, pos.lon], {
            iconContent: pos.name
        }, {
            preset: 'islands#redStretchyIcon'
        });

        group.add(mark);

    };

    this.setRoute = function(path){
        myWay.geometry.setCoordinates(path);
        map.setBounds(myWay.geometry.getBounds());
    };

    this.removeMarkers = function(){
        group.removeAll();
    };

});

app.directive('focusMe', function($timeout) {
    return {
        scope: { trigger: '@focusMe' },
        link: function(scope, element) {
            scope.$watch('trigger', function(value) {
                if(value === "true") {
                    $timeout(function() {
                        element[0].focus();
                    });
                }
            });
        }
    };
});

app.directive('typeAhead', function(ws){
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
            $(element).typeahead({
                    //источник данных
                    source: function (query, process) {

                        ws.findAddress(scope.region.province + ', ' + scope.addr.city + ', ' + query, function(list){
                            process(list);
                        });

                    }
                    //вывод данных в выпадающем списке
                    , highlighter: function(item) {
                        return item.name;
                    }
                    , matcher: function(item) {
                        return item.name;
                    }
                    , sorter: function(items) {
                        return items;
                    }
                    //действие, выполняемое при выборе елемента из списка
                    , updater: function(item) {
                        scope.addr.name = item.name;
                        scope.addAddress(scope.addr, {keyCode: 13}, scope.$index);
                        return item.name;
                    }
                }
            );
        }
    }
});

app.directive('ngSortable', function(){
    return {
        link: function(scope, element, attrs, modelCtrl) {

            $(element).sortable({
                axis: 'y',
                stop: function( event ) {

                    var newItems = [];
                    $(event.target).find('li.addr-row').each(function(){
                        var id = parseInt($(this).attr('ind'));
                        newItems.push(_.omit(scope.orderAdresses[id], '$$hashKey'));
                        console.log(id);
                    });
                    scope.orderAdresses = newItems;
                    scope.$apply();
                }
            });


        }
    }
});


var MicroEvent=function(){};
MicroEvent.prototype={on:function(a,b,c){b.ctx=c||this;this._events=this._events||{};this._events[a]=this._events[a]||[];this._events[a].push(b);return this},
    off:function(a,b){this._events=this._events||{};if(!1===a in this._events)return this;this._events[a].splice(this._events[a].indexOf(b),1);return this},
    trigger:function(a){this._events=this._events||{};if(!1===a in this._events)return this;for(var b=0;b<this._events[a].length;b++)
        this._events[a][b].apply(this._events[a][b].ctx,Array.prototype.slice.call(arguments,
            1));return this}};MicroEvent.mixin=function(a){for(var b=["on","off","trigger"],c=0;c<b.length;c++)
    "function"===typeof a?a.prototype[b[c]]=MicroEvent.prototype[b[c]]:a[b[c]]=MicroEvent.prototype[b[c]]};"undefined"!==typeof module&&"exports"in module&&(module.exports=MicroEvent);
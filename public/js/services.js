var myPos;

app.service('ws', function($http){

    var self = this;
    var connected = false;

    var navig = function(c){
        c({
            coords: {
                latitude: 56.8244397,
                longitude: 60.595625
            }
        });
    }


    // регистрация нового номера, получение смс кода
    this.register = function(phone, role, callback){
        console.log('register phone', phone);
        var query = {
            phone: phone,
            role: role
        };
        $http.post('/api/register', query).success(callback);
    }

    this.getToken = function(info, callback){

        console.log('get token for', info.phone);

        var query = {
            phone: info.phone,
            code: info.code
        };

        $http.post('/api/auth', query).success(function(res){
            if(res.error) {
                alert('Ошибка: ' + res.error);
            } else {
                localStorage.access_token = res.access_token;
                localStorage.refresh_token = res.refresh_token;
                localStorage.phone = info.phone;
                callback();
            }
        });

    }

    this.refresh = function(callback){

        console.log('get refresh token for');

        var query = {
            refresh_token: localStorage.refresh_token
        };

        $http.post('/api/refresh', query).success(function(res){
            if(res.error) {
                alert('Ошибка refresh: ' + res.error);
            } else {
                localStorage.access_token = res.access_token;
                localStorage.refresh_token = res.refresh_token;
                console.log('refreshed', localStorage.access_token);
                callback();
            }
        });

    }

    this.connect = function() {

        if (navigator.geolocation) {
            //navigator.geolocation.getCurrentPosition(function(pos){
            navig(function(pos){

                console.log('init socket connect');

                myPos = {lat: pos.coords.latitude, lon: pos.coords.longitude};

                var params = {
                    phone: localStorage.phone,
                    token: localStorage.access_token,
                    client: config.clientId,
                    signature: hex_md5(config.clientId + config.clientSecret),
                    lat: myPos.lat,
                    lon: myPos.lon
                };


                if(connected) {
                    self.socket.emit('auth', params, function(res){ });
                } else {
                    self.socket = io.connect('ws://' + config.server + '?' + $.param(params));
                    connected = true;

                    self.socket.on('disconnect', function(res){ console.log('disconnect', _.clone(res)); self.trigger('disconnect', res); });
                    self.socket.on('ready', function(res){ console.log('ready', _.clone(res)); self.trigger('ready', res); });
                    self.socket.on('order:opened', function(res){  console.log('order:opened', _.clone(res)); self.trigger('order:opened', res);});
                    self.socket.on('order:voted', function(res){ console.log('order:voted', _.clone(res)); self.trigger('order:voted', res);});
                    self.socket.on('order:changes', function(res){  console.log('order:changes', _.clone(res)); self.trigger('order:changes', res);});

                    self.socket.emit2 = function(name, data, cb){
                        console.log('>>', name, data);
                        self.socket.emit(name, data, function(d){
                            console.log('<<', name, d);
                            if(cb) cb(d);
                        });
                    }

                }

            });
        } else {
            return alert('Геопозиционирование не поддерживается');
        }

    }

    this.checkToken = function(){
        return localStorage.access_token && localStorage.refresh_token;
    }

});


app.service('map', function(){

    var map, myWay, group;

    this.createMap = function() {

        $('#map').empty();
        map = new ymaps.Map("map", {
            center: [myPos.lat, myPos.lon],
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

    }

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

    }

    this.setRoute = function(path){
        myWay.geometry.setCoordinates(path);
        map.setBounds(myWay.geometry.getBounds());
    }

    this.removeMarkers = function(){
        group.removeAll();
    }

    /*
    this.showInfo = function(info) {

        if(order.status == ORDER_STATUS_WAIT) {
            // маршрут от водителя до заказчика

            start = new ymaps.Placemark([order.driver_pos.lat, order.driver_pos.lon], {
                iconContent: 'Водитель'
            }, {
                preset: 'islands#redStretchyIcon'
            });
            finish = new ymaps.Placemark([order.start.lat, order.start.lon], {
                iconContent: 'Заказчик'
            }, {
                preset: 'islands#redStretchyIcon'
            });
            myWay = new ymaps.Polyline([], {}, {
                strokeColor: '#0000ff',
                strokeWidth: 4,
                strokeOpacity: 0.7
            });

            ws.socket.emit('route:points', {start:order.driver_pos, finish: order.start}, function(route){
                myWay.geometry.setCoordinates(route.path);
                map.setBounds(myWay.geometry.getBounds());
            });

        } else {
            // маршрут от начала до конца поездки

            start = new ymaps.Placemark([order.start.lat, order.start.lon], {
                iconContent: 'Старт'
            }, {
                preset: 'islands#redStretchyIcon'
            });
            finish = new ymaps.Placemark([order.finish.lat, order.finish.lon], {
                iconContent: 'Финиш'
            }, {
                preset: 'islands#redStretchyIcon'
            });
            myWay = new ymaps.Polyline([], {}, {
                strokeColor: '#0000ff',
                strokeWidth: 4,
                strokeOpacity: 0.7
            });
            ws.socket.emit('route:points', {start:order.start, finish: order.finish}, function(route){
                myWay.geometry.setCoordinates(route.path);
                map.setBounds(myWay.geometry.getBounds());
            });
        }

        map.geoObjects.add(start);
        map.geoObjects.add(finish);
        map.geoObjects.add(myWay);

    }
    */

});

function push2(arr, value) {
    var b = arr.splice(-1);
    arr.push(value);
    return arr.concat(b);
}
var MicroEvent=function(){};
MicroEvent.prototype={on:function(a,b,c){b.ctx=c||this;this._events=this._events||{};this._events[a]=this._events[a]||[];this._events[a].push(b);return this},
    off:function(a,b){this._events=this._events||{};if(!1===a in this._events)return this;this._events[a].splice(this._events[a].indexOf(b),1);return this},
    trigger:function(a){this._events=this._events||{};if(!1===a in this._events)return this;for(var b=0;b<this._events[a].length;b++)
        this._events[a][b].apply(this._events[a][b].ctx,Array.prototype.slice.call(arguments,
            1));return this}};MicroEvent.mixin=function(a){for(var b=["on","off","trigger"],c=0;c<b.length;c++)
    "function"===typeof a?a.prototype[b[c]]=MicroEvent.prototype[b[c]]:a[b[c]]=MicroEvent.prototype[b[c]]};"undefined"!==typeof module&&"exports"in module&&(module.exports=MicroEvent);
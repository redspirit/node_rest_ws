/**
 * Created by Алексей on 01.02.2015.
 */

var fs = require('fs');
var config = require('./../config.json');
var dataset = require('./dataset.js');


// подключаем файлы контроллеров
var Controllers = {};
var ctrlsDir = __dirname + './../controllers/';
var files = fs.readdirSync(ctrlsDir);
files.forEach(function(file){
    var name = file.split('.')[0].toLowerCase();
    Controllers[name] = require(ctrlsDir + name.charAt(0).toUpperCase() + name.substr(1).toLowerCase()  + '.js');
    console.info('Добавлен контроллер:', name);
});


exports.httpRouting = function(server, aliases, staticServer) {

    /*
    for(var key in routes) {
        var parts1 = key.split(' ');
        var parts2 = routes[key].split('.');

        if(typeof Controllers[parts2[0]] != 'object') {
            console.error('Контроллер не найден', parts2[0]);
            continue;
        }
        if(typeof Controllers[parts2[0]][parts2[1]] != 'function') {
            console.error('Не найден метод', parts2[1], 'в контроллере', parts2[0]);
            continue;
        }

        if(parts1[0] == 'get') server.get(parts1[1], Controllers[parts2[0]][parts2[1]]);
        if(parts1[0] == 'post') server.post(parts1[1], Controllers[parts2[0]][parts2[1]]);
        if(parts1[0] == 'put') server.put(parts1[1], Controllers[parts2[0]][parts2[1]]);
        if(parts1[0] == 'del') server.del(parts1[1], Controllers[parts2[0]][parts2[1]]);

    }
    */

    var httpHandler = function(req, res, next){

        var path = req._url.pathname.substr(config.url_prefix.length);
        var seg = path.split('/');
        var ctrl = seg[1];
        var func = seg[2];
        var method = req.method.toLowerCase();

        if(!ctrl || !func)
            return staticServer(req, res, next);

        if(typeof Controllers[ctrl] != 'object')
            return staticServer(req, res, next);

        if(typeof Controllers[ctrl][func + '_' + method] != 'function')
            return staticServer(req, res, next);


        req.urlParams = seg.splice(3,99);
        return Controllers[ctrl][func + '_' + method](req, res);

    };

    var escapedUrl = config.url_prefix.replace('/', '\/');
    var reg = new RegExp('(' + escapedUrl + ').*', 'g');

    server.get(reg, httpHandler);
    server.post(reg, httpHandler);
    server.put(reg, httpHandler);
    server.del(reg, httpHandler);
    server.patch(reg, httpHandler);

};

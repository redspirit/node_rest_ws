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


exports.httpRouting = function(server, httpRoutes, staticServer) {


    var httpHandler = function(req, res, next){

        var ctrl, action, cmdParts;
        var routePath = req.route.path;
        var method = req.method.toLowerCase();
        var cmd = httpRoutes[method + ' ' + routePath] || httpRoutes['all ' + routePath];

        console.log('params', cmd);
        //console.log('query', req);



        if(!cmd)
            return staticServer(req, res, next);


        cmdParts = cmd.split('.');


        if(cmdParts.length != 2)
            return staticServer(req, res, next);


        if(cmdParts[0][0] == ':') {
            ctrl = req.params[cmdParts[0].substr(1)];
            if(!ctrl) ctrl = cmdParts[0].substr(1);
        } else {
            ctrl = cmdParts[0];
        }

        if(cmdParts[1][0] == ':') {
            action = req.params[cmdParts[1].substr(1)];
            if(!action) action = cmdParts[1].substr(1);
        } else {
            action = cmdParts[1];
        }

        if(cmdParts[2] == '>') {

            // предписание передать управление, но как?

        }


        console.log(ctrl, action);


        if(typeof Controllers[ctrl] != 'object')
            return staticServer(req, res, next);

        if(typeof Controllers[ctrl][action] != 'function')
            return staticServer(req, res, next);


        return Controllers[ctrl][action](req, res, next);

    };



     for(var key in httpRoutes) {
         var parts = key.split(' ');
         var cmd = httpRoutes[key];

         if(parts[0] == 'get') server.get(parts[1], httpHandler);
         if(parts[0] == 'post') server.post(parts[1], httpHandler);
         if(parts[0] == 'put') server.put(parts[1], httpHandler);
         if(parts[0] == 'del') server.del(parts[1], httpHandler);
         if(parts[0] == 'del') server.patch(parts[1], httpHandler);
         if(parts[0] == 'all') {
             server.get(parts[1], httpHandler);
             server.post(parts[1], httpHandler);
             server.put(parts[1], httpHandler);
             server.del(parts[1], httpHandler);
             server.patch(parts[1], httpHandler);
         }

     }




};

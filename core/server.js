/**
 * Created by Alexey Tayanchin on 25.07.14.
 */

var config = require('./../config.json');
var router = require('./router.js');


var restify = require('restify');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.ws_port });

var server = restify.createServer({
    name: 'myapp',
    version: '1.0.0'
});
var sockUsers = {};
var sockRooms = {};


server.pre(restify.pre.sanitizePath());
//server.use(restify.CORS());
//server.use(restify.acceptParser(server.acceptable));
//server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());


exports.Start = function(httpRoutes, wsRoutes){

    router.httpRouting(server, httpRoutes, restify.serveStatic({
        directory: __dirname + '/..' + config.public_path,
        default: 'index.html',
        maxAge: config.file_cache
    }));


    ws_paths(wsRoutes);


    // запуск серера
    server.listen(config.http_port, function() {
        console.log('%s listening at %s', server.name, server.url);
    });

};



function ws_paths(routes){

    wss.on('connection', function(ws) {



    });

}

/**
 * Created by Alexey Tayanchin on 15.07.14.
 */

var server = require('./core/server.js');

var routes = {
    'get /registerz':                   'auth.register',
    'get /authz':                       'auth.getToken',

    'all /api/:controller/:action':    ':controller.:action'
};

var ws_routes = {
    'connect':                  'auth.connect',         // подключение к сокету
    'disconnect':               'auth.disconnect',      // отключение от сокета

    'user:profile':             'user.updateProfile',
    'user:position':            'user.setPosition'
};

server.Start(routes, ws_routes);

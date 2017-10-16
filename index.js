const debug = require('debug')('Easyql');

var Transaction = require('./lib/Transaction');
var connectInfo = null;

var Client = require('mariasql');

var Easyql = function () {
    
};

Easyql.init = function init(config) {
    connectInfo = config;
};

Easyql.connect = function connect() {
    var client = new Client(connectInfo);
    return new Transaction(client);
};

module.exports = Easyql;


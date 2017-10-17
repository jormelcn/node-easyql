var Transaction = require('./lib/Transaction');
var connectInfo = null;

var Client = require('mariasql');

var Easyql = function () {
    
};

Easyql.debug = require('debug')('Easyql');

Easyql.errorHandler = null;

Easyql.init = function init(config) {
    connectInfo = config;
};

Easyql.connect = function connect() {
    var client = new Client(connectInfo);
    return new Transaction(client);
};

Transaction.init(Easyql);

module.exports = Easyql;


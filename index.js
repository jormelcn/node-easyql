
var Easyql = function () {
    
};

Easyql.Transaction = require('./lib/Transaction')(Easyql);
Easyql.Query = require('./lib/Query')(Easyql);
Easyql.Commiter = require('./lib/Commiter')(Easyql);
Easyql.debug = require('debug')('Easyql');
Easyql.errorHandler = null;

Easyql.init = function init(config) {
    Easyql.connectInfo = config;
    Easyql.Client = require('mariasql');
};

Easyql.connect = function connect() {
    return new Easyql.Transaction(new Easyql.Client(Easyql.connectInfo));
};

module.exports = Easyql;


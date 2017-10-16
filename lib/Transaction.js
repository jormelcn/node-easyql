var Query = require('./Query');

var Transaction = function (client) {
    this.client = client;
};

Transaction.prototype.query = function query(rawQuery) {
    return new Query(this, rawQuery);
};

Transaction.prototype.select = function select(table) {
    var firstFragment;
    if(typeof table === 'string'){
        firstFragment = 'SELECT * FROM ' + table;
    }
    else{
        for (var key in table) {
            firstFragment = 'SELECT ' + table[key].join(',') + ' FROM ' + key;
            break;
        }
    }
    return new Query(this, firstFragment);
};

Transaction.prototype.insertInto = function insertInto(table) {
    var firstFragment;
    if(typeof table === 'string'){
        firstFragment = 'INSERT INTO ' + table;
    }
    else{
        for (var key in table) {
            firstFragment = 'INSERT INTO ' + key + '(' + table[key].join(',') + ')';
            break;
        }
    }
    return new Query(this, firstFragment);
};

Transaction.close = function close() {
    
};

module.exports = Transaction;
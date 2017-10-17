var Query = require('./Query');
var Easyql;

var Transaction = function (client) {
    this.client = client;
    this.errorHandler = Easyql.errorHandler;
    debug = Easyql
};

Transaction.init = function init(easyql) {
    Easyql = easyql;
    Query.init(Easyql);
}

Transaction.prototype.query = function query(rawQuery) {
    return new Query(this, rawQuery);
};

Transaction.prototype.transaction = function transaction(){
    this.query('START TRANSACTION').commit(arguments);
}

Transaction.prototype.commit = function commit(){
    this.query('COMMIT').commit(arguments);
}

Transaction.prototype.rollback = function rollback(){
    this.query('ROLLBACK').commit(arguments);
}

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

Transaction.prototype.join = function join(list) {
    var columns = [];
    var tables = [];
    for(var table in list){
        tables.push(table);
        var c = list[table].length;
        for(var i = 0; i < c; i++){
            columns.push(table + '.' + list[table][i]);
        }
    }
    return new Query(this, 'SELECT ' + columns.join(', ') + ' FROM ' + tables.join(', '));
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

Transaction.prototype.update = function update(table) {
    return new Query(this, 'UPDATE ' + table);
};

Transaction.prototype.deleteFrom = function deleteFrom(table) {
    return new Query(this, 'DELETE FROM ' + table);
};

Transaction.prototype.count = function count(table) {
    return new Query(this, 'SELECT COUNT(*) FROM ' + table);
};

Transaction.close = function close() {
    this.client.end();
};

module.exports = Transaction;
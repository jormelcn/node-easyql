var Query = require('./Query');

var Transaction = function (easyql, client) {
    this.easyql = easyql;
    this.client = client;
    this.errorHandler = null;
};

Transaction.prototype.handleError = function handleError(){
    
}

Transaction.prototype.query = function query(rawQuery) {
    return new Query(this, rawQuery);
};

Transaction.prototype.transaction = function transaction(){
    this.query('START TRANSACTION').commit();
}

Transaction.prototype.commit = function commit(callback, err){
    this.query('COMMIT').commit(callback, err);
}

Transaction.prototype.rollback = function rollback(){
    //TODO
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
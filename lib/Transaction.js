var Easyql;

var Transaction = function (client) {
    this.client = client;
    this.errorHandler = Easyql.errorHandler;
    this.commiter = null;
};

var init = function init(easyql) {
    Easyql = easyql;
    return Transaction;
};

Transaction.prototype.query = function query(firstfragment){
    var query = new Easyql.Query(this, firstfragment);
    if(this.commiter){
        this.commiter.add(query);
    }
    return query;
};

Transaction.prototype.transaction = function transaction(){
    if(this.commiter){
        throw new Error('Trasaction cant start in secuence');
    }
    if(arguments.length > 0){
        var startQuery = new Easyql.Query(this, 'START TRANSACTION');
        startQuery.commit(arguments);
    }else{
        this.commiter = new Easyql.Commiter(this, true);
    }
};

Transaction.prototype.sequence = function startSequence(){
    if(this.commiter){
        throw new Error('Previusly secuence not finished');
    }
    this.commiter = new Easyql.Commiter(this, false);
};

Transaction.prototype.commit = function commit(){
    if(this.commiter){
        this.commiter.commit(arguments);
        this.commiter = null;
    }else{
        var commitQuery = new Easyql.Query(this, 'COMMIT');
        commitQuery.commit(arguments);
    }
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
    return this.query(firstFragment);
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
    return this.query('SELECT ' + columns.join(', ') + ' FROM ' + tables.join(', '));
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
    return this.query(firstFragment);
};

Transaction.prototype.update = function update(table) {
    return this.query('UPDATE ' + table);
};

Transaction.prototype.deleteFrom = function deleteFrom(table) {
    return this.query('DELETE FROM ' + table);
};

Transaction.prototype.count = function count(table) {
    return this.query('SELECT COUNT(*) FROM ' + table);
};

Transaction.close = function close() {
    this.client.end();
};

module.exports = init;

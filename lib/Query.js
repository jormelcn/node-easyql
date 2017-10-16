
var Query = function (transaction, firstFragment) {
    this.transaction = transaction;
    this.fragments = [firstFragment];
};

Query.prototype.toString = function toString() {
    return this.fragments.join(' ');
};

Query.prototype.where = function where(where) {
    if(typeof where === 'string'){
        this.fragments.push('WHERE ' + where);
    }
    else if(where instanceof Array){
        this.fragments.push('WHERE ' + where.join(' AND '));
    }

    return this;
}

Query.prototype.limit = function limit(limit){
    this.fragments.push('LIMIT ' + limit);

    return this;
}

Query.prototype.values = function values(rows){
    if(!(rows instanceof Array)) rows = [rows];
    
    var colums = Object.keys(rows[0]);
    this.fragments.push('(' + colums.join(',') + ') VALUES');
    
    var rowsCount = rows.length;
    var columsCount = colums.length;

    var groups = [];
    for(i = 0; i < rowsCount; i++){
        var values = []
        for(j = 0; j < columsCount; j++){
            values.push(rows[i][colums[j]]);
        }
        groups.push('(' + values.join(',') + ')');
    }
    this.fragments.push(groups.join(','));

    return this;
}

Query.prototype.select = function select(table) {
    if(typeof table === 'string'){
        this.fragments.push('SELECT * FROM ' + table);
    }
    else{
        for (var key in table) {
            this.fragments.push('SELECT ' + table[key].join(',') + ' FROM ' + key);
            break;
        }
    }
    
    return this;
};

Query.prototype.commit = function commit() {
    var vars = null;
    if(arguments.length > 1) vars = arguments[0];    
    var callback = arguments[arguments.length - 1];
    var rawQuery = this.toString();
    console.log(rawQuery);
    this.transaction.client.query(rawQuery, vars, function (err, rows) {
        if(err) console.log(err);
        callback({rows:rows});
    });
};

module.exports = Query;
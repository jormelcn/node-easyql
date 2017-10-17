
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

Query.prototype.orderBy = function orderBy(order){
    if(order instanceof Array){
        this.fragments.push('ORDER BY ' + order.join(','));
    }
    else {
        this.fragments.push('ORDER BY ' + order);
    }

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
            values.push('"' + rows[i][colums[j]] + '"');
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

Query.prototype.set = function set(values){
    if(typeof values === 'string'){
        this.fragments.push('SET ' + values);
    }
    else{
        var sets = []
        for (var key in values) {
            sets.push(key + ' = "' + values[key] + '"');
        }
        this.fragments.push('SET ' + sets.join(','));
    }
    
    return this;
}

Query.prototype.commit = function commit() {
    var call = null;
    var vars = null;
    var errCall = null;

    if(arguments.length  === 1){
        call = arguments[0];
    } 
    else if(arguments.length  === 2){
        if(typeof arguments[0] === 'function'){
            call = arguments[0];
            errCall = arguments[1];
        }
        else {
            vars = arguments[0];
            call = arguments[1];
        }
    }
    else if(arguments.length === 3){
        vars = arguments[0];
        call = arguments[1];
        errCall = arguments[2];
    }
    var rawQuery = this.toString();
    console.log(rawQuery);
    this.transaction.client.query(rawQuery, vars, function (err, rows) {
        if(err){
            console.log('code:' + err.code);
            console.log('message: ' + err.message);
        } 
        else call({rows:rows, info:rows.info});
    });
};

module.exports = Query;
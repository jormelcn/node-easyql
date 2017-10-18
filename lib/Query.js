var Easyql;

var Query = function (transaction, firstFragment) {
    this.transaction = transaction;
    this.fragments = [firstFragment];
    this.vars = null;
};

var init = function init(easyql){
    Easyql = easyql;
    return Query;
}

Query.prototype.parse = function parse(values){
    this.vars = values;
    return this;
}

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

var resolveCommitArguments = function (args){
    var result = {callback: null, vars: null, errorHandler: null };
    if(args.length === 1){
        if(args[0] instanceof Array)
            return resolveCommitArguments(args[0]);
        else
            result.callback = args[0];
    }
    else if(args.length === 2){
        if(typeof args[0] === 'function'){
            result.callback = args[0];
            result.errorHandler = args[1];
        }
        else {
            result.vars = args[0];
            result.callback = args[1];
        }
    }
    else if(args.length === 3){
        result.vars = args[0];
        result.callback = args[1];
        result.errorHandler = args[2];
    }

    return result;
}

Query.prototype.commit = function commit() {
    var args = resolveCommitArguments(arguments);
    if(args.vars === null) args.vars = this.vars;
    var rawQuery = this.toString();
    var _this = this;
    this.transaction.client.query(rawQuery, args.vars, function (err, rows) {
        if(err){
            if(args.errorHandler){
                args.errorHandler(err);
            } else if(_this.transaction.errorHandler){
                _this.transaction.errorHandler(err);
            } else {
                Easyql.debug('Unhandled Error {' + err + '}');
            }
        } 
        else if(args.callback){ args.callback({rows:rows, info:rows.info}); }
    });
};

module.exports = init;
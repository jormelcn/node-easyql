var Easyql;

var Commiter = function Commiter(transaction, onTransaction){
    this.commited = false;
    this.transaction = transaction;
    this.onTransaction = onTransaction;
    this.queries = [];
    this.index = 0;
    this.callback = null;
    this.errorHandler = transaction.errorHandler;
    this.responses = null;
}

var init = function init(easyql){
    Easyql = easyql;
    return Commiter;
}

Commiter.prototype.add = function add(query) {
    if(!this.commited)
        this.queries.push(query);
}

var realCommit = function realCommit(commiter){
    if(commiter.index >= commiter.queries.length){
        if(commiter.onTransaction){
            commiter.responses.pop();
            commiter.responses.shift();
        }
        commiter.callback(commiter.responses);
    } else {
        var query = commiter.queries[commiter.index];
        commiter.index++;
        query.commit(function(result){
            commiter.responses.push(result);
            realCommit(commiter);
        }, function(error){
            if(commiter.onTransaction){
                var rollbackQuery = new Easyql.Query(commiter.transaction, 'ROLLBACK');
                Easyql.debug('Error on Transaction secuence');
                rollbackQuery.commit(function(){ Easyql.debug('Rollback Success') });
            }
            if(commiter.errorHandler){
                commiter.errorHandler(error);
            } else {
                Easyql.debug('Unhandled Error {' + error + '}')
            }
        });
    }
}

Commiter.prototype.commit = function commit(callbacks){
    if(!this.commited){
        this.commited = true;
        if(this.onTransaction){
            this.queries.unshift(new Easyql.Query(this.transaction,'START TRANSACTION'));
            this.queries.push(new Easyql.Query(this.transaction,'COMMIT'));
        }
        this.callback = callbacks[0];
        if(callbacks.length > 1)
            this.errorHandler = callbacks[1];
        this.responses = [];
        realCommit(this);
    }
}

module.exports = init;
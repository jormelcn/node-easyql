import { Easyql } from './easyql';
import { Query } from './query';
import { EasyErrorHandler as ErrorHandler} from 'easyerror';
import { EasyError as Error} from 'easyerror';
import * as Debug from 'debug';
import { MariaClient } from 'mariasql';

export class Connection {
  
  static debug : any = Debug('easyql:connection');
  static numConnections = 0;

  id : number;
  onTransaction = false;
  autoRollBack = true;
  client : MariaClient = null;

  constructor(
    public easyql : Easyql,
    public errorHandler : ErrorHandler,
  ) {
    this.id = Connection.numConnections++;
  }

  private reportError(handler : ErrorHandler, error : Error){
    if (handler) {
      handler.reportError(error);
    } else if (this.errorHandler) {
      this.errorHandler.reportError(error);
    } else {
      Connection.debug('Unhandled Error: ' + error.toString());
    }
  }

  query(firstfragment: string) : Query{
    let query = new Query(this, firstfragment);
    return query;
  };

  transaction(call: () => void, errorHandler?: ErrorHandler) {
    if(this.onTransaction){
      this.reportError(errorHandler, new Error('Transaccion activa, START TRANSACTION denegado'));
    }
    else{
      var startQuery = new Query(this, 'START TRANSACTION');
      this.onTransaction = true;
      startQuery.commit(
        () => { 
          Connection.debug('Connection: ' + this.id + ' TRANSACTION');
          call();
        },
        errorHandler);
    }
  };

  rollBack(call : () => void, errorHandler? : ErrorHandler ){
    if(!this.onTransaction){
      this.reportError(errorHandler, new Error('No hay transaccion activa, Rollback denegado'));
    }
    else{
      var query = new Query(this, 'ROLLBACK');
      this.onTransaction = false;
      query.commit( () => {
        Connection.debug('Connection: ' + this.id + ' ROLLBACK');
        call();
      }, errorHandler);
    }
  }

  commit(call : () => void, errorHandler? : ErrorHandler) {
    if(!this.onTransaction){
      this.reportError(errorHandler, new Error('No hay transaccion activa, COMMIT denegado'));
    }
    else{
      var query = new Query(this, 'COMMIT');
      this.onTransaction = false;
      query.commit( () => {
        Connection.debug('Connection: ' + this.id + ' COMMIT');
        call();
      }, errorHandler);
    }
  }

  select(colums : string) : Query;
  select(colums : string[]) : Query;
  select(colums : void) : Query
  select(columns: string|string[]|void) : Query{
    let firstfragment;
    if(columns){
      if(columns instanceof Array)
      columns = columns.join(',');
      firstfragment = 'SELECT ' + columns;
    }else{
      firstfragment = 'SELECT';
    }
    return this.query(firstfragment);
  };

  join(list: any) : Query{
    let columns = [];
    let tables = [];
    for (let table in list) {
      tables.push(table);
      let c = list[table].length;
      for (let i = 0; i < c; i++) {
        columns.push(table + '.' + list[table][i]);
      }
    }
    return this.query('SELECT ' + columns.join(', ') + ' FROM ' + tables.join(', '));
  };

  insertInto(table: string) : Query{
    return this.query('INSERT INTO ' + table);
  };

  update(table: string) : Query{
    return this.query('UPDATE ' + table);
  };

  deleteFrom(table: string) : Query{
    return this.query('DELETE FROM ' + table);
  };

}

import { Connection } from './connection';
import {MariaCallBack, MariaClient} from 'mariasql';
import * as Debug from 'debug';
import { EasyError } from 'easyerror';
import { ErrorHandler } from 'easyerror/dist/lib/error-handler';
import { CommitCallBack } from './commit-callback';

export class Query {

  static debug : any = Debug('easyql:query');

  connection: Connection;
  fragments: string[];
  vars: any;

  constructor(connection: Connection, firstFragment) {
    this.connection = connection;
    this.fragments = [firstFragment];
    this.vars = null;
  };

  parse(values: any) : Query {
    this.vars = values;
    return this;
  }

  limit(limit: number) : Query {
    this.fragments.push('LIMIT ' + limit);
    return this;
  }

  orderBy(order : string) : Query;
  orderBy(order : string[]) : Query;
  orderBy(order) : Query {
    if (order instanceof Array) {
      this.fragments.push('ORDER BY ' + order.join(','));
    }
    else {
      this.fragments.push('ORDER BY ' + order);
    }
    return this;
  }

  count(count : string) : Query{
    this.fragments.push('COUNT(' + count + ')');
    return this;
  }

  values(values : any[]) : Query;
  values(values : any) : Query;
  values(values) : Query {
    if (!(values instanceof Array)) values = [values];
    if ( !(values instanceof Array) || values.length == 0)
      throw new EasyError('Query Values Invalid');
    let colums = Object.keys(values[0]);
    this.fragments.push('(' + colums.join(',') + ') VALUES');

    let rowsCount = values.length;
    let columsCount = colums.length;

    let groups = [];
    for (let i = 0; i < rowsCount; i++) {
      let rows = []
      for (let j = 0; j < columsCount; j++) {
        rows.push('"' + values[i][colums[j]] + '"');
      }
      groups.push('(' + rows.join(',') + ')');
    }
    this.fragments.push(groups.join(','));
    return this;
  }

  select(columns : string[]) : Query
  select(columns : string) : Query
  select(columns) : Query {
    if (typeof columns === 'string') {
      this.fragments.push('SELECT ' + columns);
    }
    else {
      this.fragments.push('SELECT ' + columns.join(','));   
    }
    return this;
  };

  where(conditions : string) : Query;
  where(conditions : string[]) : Query;
  where(conditions) : Query {
    if (typeof conditions === 'string') {
      this.fragments.push('WHERE ' + conditions);
    }
    else {
        this.fragments.push('WHERE ' + conditions.join(' AND '));
    }
    return this;
  }

  from(table : string) : Query;
  from(tables : string[]) : Query;
  from(tables) : Query {
    if (typeof tables === 'string') {
      this.fragments.push('FROM ' + tables);
    }
    else {
        this.fragments.push('FROM ' + tables.join(','));
    }
    return this;
  }

  set(expresion : string) : Query;
  set(values : any) : Query;
  set(values) : Query {
    if (typeof values === 'string') {
      this.fragments.push('SET ' + values);
    }
    else {
      var sets = []
      for (var key in values) {
        sets.push(key + ' = "' + values[key] + '"');
      }
      this.fragments.push('SET ' + sets.join(','));
    }
    return this;
  }

  private reportError(handler : ErrorHandler, error : EasyError){
    if (handler) {
      handler.reportError(error);
    } else if (this.connection.errorHandler) {
      this.connection.errorHandler.reportError(error);
    } else {
      Query.debug('Unhandled Error: ' + error.toString());
    }
  }

  toString() : string{
    return this.fragments.join(' ');
  };

  private realCommit<T>(client : MariaClient, call: CommitCallBack<T>, errorHandler ?: ErrorHandler){
    let callBack : MariaCallBack<T> = (error, rows) => {
      if (error) { 
        Query.debug('Connection: ' + this.connection.id + ' Query Error');
        if(this.connection.onTransaction && this.connection.autoRollBack){
          this.connection.rollBack(() => {
            this.reportError(errorHandler, new EasyError(error.message));  
          }, {
            reportError : rollBackError => {
              let superError = new EasyError('RollbackError: ' + rollBackError.message + '; PrevError: ' + error.message);
              this.reportError(errorHandler, superError);
            }
          })
        } else {
          this.reportError(errorHandler, new EasyError(error.message));
        }
      } else {
        call(rows.info, rows);
      }
      if(!this.connection.onTransaction){
        this.connection.easyql.pool.release(client);
      }
    }
    let rawQuery = this.toString();
    Query.debug('Connection: ' + this.connection.id + ' Query: ' + rawQuery);
    client.query(rawQuery, this.vars, callBack);
  }

  commit<T>(call: CommitCallBack<T>, errorHandler ?: ErrorHandler) {
    if(this.connection.client){
      this.realCommit(this.connection.client, call, errorHandler);
    }else{
      this.connection.easyql.pool.acquire(
        client => {
          if(this.connection.onTransaction){
            this.connection.client = client;
          }
          this.realCommit(client, call, errorHandler);
        }, error => {
          this.reportError(errorHandler, error);
        }
      );
    }
  }

}
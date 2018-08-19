import * as Client from 'mariasql';
import { MariaClient, ClientConfig} from 'mariasql';
import { Connection } from './connection';
import { EasyPool, EasyPoolMethods } from 'easypool/dist';
import { EasyErrorHandler as ErrorHandler} from 'easyerror/dist';

export class Easyql {
  public pool : EasyPool<MariaClient, ErrorHandler>;
  
  constructor(
    private config : ClientConfig
  ){
    this.pool = new EasyPool(
      {
        create : (listener) => {
          let client = new Client(this.config);
          listener(client);
        },
        destroy : (client) => {
          client.end();
        }
      }, 
      {
        min : 3,
        max : 6,
        maxWaitingClients : 10,
        waitingTimeOut : 5000,
        destroyIdleAfter : 10000,
        releaseAcquiredAfter : 10000
      }
    );
  }

  connect(errorHandler : ErrorHandler) : Connection {
    return new Connection(this, errorHandler);
  }

}



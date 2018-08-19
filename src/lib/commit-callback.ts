import { Info } from "./info";

export interface CommitCallBack<T> {
  (info : Info, rows : Array<T>)
}

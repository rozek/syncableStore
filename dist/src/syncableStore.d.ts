/*******************************************************************************
*                                                                              *
*                                SyncableStore                                 *
*                                                                              *
*******************************************************************************/
import { SyncedDoc, SyncedArray, SyncedMap, SyncedXml, SyncedText, Box, boxed, areSame, Y, getYjsValue } from '@syncedstore/core';
export declare function syncableStore(Callback: Function, reportClosestArrayObject?: boolean, sharedDoc?: any): any;
/**** getYjsDoc (modified for syncableStore) ****/
export declare function getYjsDoc(StoreRoot: any): SyncedDoc;
/**** transact (modified for syncableStore) ****/
export declare function transact(StoreRoot: any, Callback: Function): void;
export { SyncedDoc, SyncedArray, SyncedMap, SyncedXml, SyncedText, Box, boxed, areSame, Y, getYjsValue };

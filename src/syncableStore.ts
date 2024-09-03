/*******************************************************************************
*                                                                              *
*                                SyncableStore                                 *
*                                                                              *
*******************************************************************************/

  import {
    syncedStore, SyncedArray,SyncedMap,SyncedXml,SyncedText, Box,boxed,
    observeDeep, areSame,
    Y, getYjsDoc as _getYjsDoc, getYjsValue
  } from '@syncedstore/core'

/**** syncableStore ****/

  const StoreOfRoot:WeakMap<any,any> = new WeakMap()

  export function syncableStore (
    Callback:Function, reportClosestArrayObject:boolean = false, sharedDoc?:any
  ):any {
    const sharedStore = syncedStore({ Root:{} },sharedDoc)
      const StoreRoot = sharedStore.Root
      StoreOfRoot.set(StoreRoot,sharedStore)

      StoreEntryOfYjsItem.set(getYjsValue(StoreRoot),StoreRoot)

      if (Callback != null) {
        observeDeep(StoreRoot,
          (...ArgList:any[]) => reportChanges(ArgList[1],StoreRoot,reportClosestArrayObject,Callback)
        )
      }
    return sharedStore.Root
  }

/**** getYjsDoc (modified for syncableStore) ****/

  export function getYjsDoc (StoreRoot:any) {
    const Store = StoreOfRoot.get(StoreRoot)
    if (Store == null) throw new Error(
      'NoSuchStore: the given object is not a valid "SyncableStore"'
    )

    return _getYjsDoc(Store)
  }

/**** transact (modified for syncableStore) ****/

  export function transact (StoreRoot:any, Callback:Function) {
    const YjsDoc = getYjsDoc(StoreRoot)
    if (YjsDoc == null) throw new Error(
      'NoYjsDoc: no Yjs document for the given "SyncableStore" found'
    )

// @ts-ignore TS2345 don't be too strict regarding the function signature
    YjsDoc.transact(Callback)
  }

/**** reportChanges ****/

  function reportChanges (
    YjsTransaction:any, StoreRoot:any, reportClosestArrayObject:boolean,
    Callback:Function
  ):void {
    const Transaction:Map<any,string[]> = new Map()
      YjsTransaction.changed.forEach((PropertySet:any,Container:any) => {
        let changedEntry = StoreEntryForYjsItem(Container,StoreRoot)
        if (changedEntry != null) {
          if (Array.isArray(changedEntry) && reportClosestArrayObject) {
            reportClosestObjectWithArray(Container,StoreRoot,Transaction)
          } else {
            if (PropertySet.size === 0) {
              memoizeContentsOf(changedEntry)
              Transaction.set(changedEntry,[])
            } else {
              for (let Property of PropertySet) {
                const Entry   = changedEntry[Property]
                const YjsItem = getYjsValue(Entry)
                if (YjsItem != null) {
                  StoreEntryOfYjsItem.set(YjsItem,Entry)
                  memoizeContentsOf(Entry)
                }
              }
              Transaction.set(changedEntry,Array.from(PropertySet.values() as string[]).filter(
                (Candidate:any) => Candidate != null
              ))
            }
          }
        }
      })
    Callback(Transaction)
  }

/**** StoreEntryForYjsItem ****/

  const StoreEntryOfYjsItem:WeakMap<any,any> = new WeakMap()

  function StoreEntryForYjsItem (YjsItem:any, StoreRoot:any):any {
    const knownEntry = StoreEntryOfYjsItem.get(YjsItem)
    if (knownEntry != null) { return knownEntry }

    const outerYjsItem = (
      YjsItem._item?.parent || YjsItem._start?.parent || getYjsValue(StoreRoot)
    )
    if (outerYjsItem == null) throw new Error(
      'NoRegisteredRoot: the given store root has no Yjs counterpart'
    )

    const outerEntry = StoreEntryOfYjsItem.get(outerYjsItem)
    if (outerEntry == null) { return undefined }

    let matchingEntry = undefined
    if (Array.isArray(outerEntry)) {
      matchingEntry = outerEntry.find(         // scan array for changed element
        (Candidate:any) => getYjsValue(Candidate) === YjsItem
      )
    } else {
      const knownProperty = YjsItem._item?.parentSub
      if (typeof knownProperty === 'string') {   // directly access changed item
        matchingEntry = outerEntry[knownProperty]
      } else {
        matchingEntry = outerEntry.values().find(// scan object for changed item
          (Candidate:any) => getYjsValue(Candidate) === YjsItem
        )
      }
    }

    if (matchingEntry != null) {                        // memoize changed entry
      StoreEntryOfYjsItem.set(YjsItem,matchingEntry)
      memoizeContentsOf(matchingEntry)
    }

    return matchingEntry                               // may still be undefined
  }

/**** reportClosestObjectWithArray ****/

  function reportClosestObjectWithArray (
    YjsItem:any, StoreRoot:any, Transaction:Map<any,string[]>
  ):void {
    const outerYjsItem = (
      YjsItem._item?.parent || YjsItem._start?.parent || getYjsValue(StoreRoot)
    )
    if (outerYjsItem._start == null) {
      let outerEntry = StoreEntryOfYjsItem.get(outerYjsItem)

      let Property = Object.keys(outerEntry).find(// scan for prop. with YjsItem
        (Candidate:any) => getYjsValue(outerEntry[Candidate]) === YjsItem
      )
      Transaction.set(outerEntry,[Property as  string])
    } else {
      reportClosestObjectWithArray(outerYjsItem,StoreRoot,Transaction)
    }
  }

/**** reportChanges ****/

  function memoizeContentsOf (StoreEntry:any):void {
    let EntryList = (
      Array.isArray(StoreEntry) ? StoreEntry : Object.values(StoreEntry)
    )

    EntryList.forEach((Entry:any) => {
      const YjsItem = getYjsValue(Entry)
      if (YjsItem != null) {
        StoreEntryOfYjsItem.set(YjsItem,Entry)
        memoizeContentsOf(Entry)
      }
    })
  }

  export {
    SyncedArray,SyncedMap,SyncedXml,SyncedText, Box,boxed,
    areSame,
    Y, getYjsValue
  }
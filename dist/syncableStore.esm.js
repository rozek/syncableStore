import { syncedStore, getYjsValue, observeDeep, getYjsDoc as getYjsDoc$1 } from '@syncedstore/core';
export { Box, SyncedArray, SyncedDoc, SyncedMap, SyncedText, SyncedXml, Y, areSame, boxed, getYjsValue } from '@syncedstore/core';

/*******************************************************************************
*                                                                              *
*                                SyncableStore                                 *
*                                                                              *
*******************************************************************************/
/**** syncableStore ****/
const StoreOfRoot = new WeakMap();
function syncableStore(Callback, reportClosestArrayObject = false, sharedDoc) {
    const sharedStore = syncedStore({ Root: {} }, sharedDoc);
    const StoreRoot = sharedStore.Root;
    StoreOfRoot.set(StoreRoot, sharedStore);
    StoreEntryOfYjsItem.set(getYjsValue(StoreRoot), StoreRoot);
    if (Callback != null) {
        observeDeep(StoreRoot, (...ArgList) => reportChanges(ArgList[1], StoreRoot, reportClosestArrayObject, Callback));
    }
    return sharedStore.Root;
}
/**** getYjsDoc (modified for syncableStore) ****/
function getYjsDoc(StoreRoot) {
    const Store = StoreOfRoot.get(StoreRoot);
    if (Store == null)
        throw new Error('NoSuchStore: the given object is not a valid "SyncableStore"');
    return getYjsDoc$1(Store);
}
/**** transact (modified for syncableStore) ****/
function transact(StoreRoot, Callback) {
    const YjsDoc = getYjsDoc(StoreRoot);
    if (YjsDoc == null)
        throw new Error('NoYjsDoc: no Yjs document for the given "SyncableStore" found');
    // @ts-ignore TS2345 don't be too strict regarding the function signature
    YjsDoc.transact(Callback);
}
/**** reportChanges ****/
function reportChanges(YjsTransaction, StoreRoot, reportClosestArrayObject, Callback) {
    const Transaction = new Map();
    YjsTransaction.changed.forEach((PropertySet, Container) => {
        let changedEntry = StoreEntryForYjsItem(Container, StoreRoot);
        if (changedEntry != null) {
            if (Array.isArray(changedEntry) && reportClosestArrayObject) {
                reportClosestObjectWithArray(Container, StoreRoot, Transaction);
            }
            else {
                if (PropertySet.size === 0) {
                    memoizeContentsOf(changedEntry);
                    Transaction.set(changedEntry, []);
                }
                else {
                    for (let Property of PropertySet) {
                        const Entry = changedEntry[Property];
                        const YjsItem = getYjsValue(Entry);
                        if (YjsItem != null) {
                            StoreEntryOfYjsItem.set(YjsItem, Entry);
                            memoizeContentsOf(Entry);
                        }
                    }
                    Transaction.set(changedEntry, Array.from(PropertySet.values()).filter((Candidate) => Candidate != null));
                }
            }
        }
    });
    Callback(Transaction);
}
/**** StoreEntryForYjsItem ****/
const StoreEntryOfYjsItem = new WeakMap();
function StoreEntryForYjsItem(YjsItem, StoreRoot) {
    const knownEntry = StoreEntryOfYjsItem.get(YjsItem);
    if (knownEntry != null) {
        return knownEntry;
    }
    const outerYjsItem = (YjsItem._item?.parent || YjsItem._start?.parent || getYjsValue(StoreRoot));
    if (outerYjsItem == null)
        throw new Error('NoRegisteredRoot: the given store root has no Yjs counterpart');
    const outerEntry = StoreEntryOfYjsItem.get(outerYjsItem);
    if (outerEntry == null) {
        return undefined;
    }
    let matchingEntry = undefined;
    if (Array.isArray(outerEntry)) {
        matchingEntry = outerEntry.find(// scan array for changed element
        (Candidate) => getYjsValue(Candidate) === YjsItem);
    }
    else {
        const knownProperty = YjsItem._item?.parentSub;
        if (typeof knownProperty === 'string') { // directly access changed item
            matchingEntry = outerEntry[knownProperty];
        }
        else {
            matchingEntry = outerEntry.values().find(// scan object for changed item
            (Candidate) => getYjsValue(Candidate) === YjsItem);
        }
    }
    if (matchingEntry != null) { // memoize changed entry
        StoreEntryOfYjsItem.set(YjsItem, matchingEntry);
        memoizeContentsOf(matchingEntry);
    }
    return matchingEntry; // may still be undefined
}
/**** reportClosestObjectWithArray ****/
function reportClosestObjectWithArray(YjsItem, StoreRoot, Transaction) {
    const outerYjsItem = (YjsItem._item?.parent || YjsItem._start?.parent || getYjsValue(StoreRoot));
    if (outerYjsItem._start == null) {
        let outerEntry = StoreEntryOfYjsItem.get(outerYjsItem);
        let Property = Object.keys(outerEntry).find(// scan for prop. with YjsItem
        (Candidate) => getYjsValue(outerEntry[Candidate]) === YjsItem);
        Transaction.set(outerEntry, [Property]);
    }
    else {
        reportClosestObjectWithArray(outerYjsItem, StoreRoot, Transaction);
    }
}
/**** reportChanges ****/
function memoizeContentsOf(StoreEntry) {
    let EntryList = (Array.isArray(StoreEntry) ? StoreEntry : Object.values(StoreEntry));
    EntryList.forEach((Entry) => {
        const YjsItem = getYjsValue(Entry);
        if (YjsItem != null) {
            StoreEntryOfYjsItem.set(YjsItem, Entry);
            memoizeContentsOf(Entry);
        }
    });
}

export { getYjsDoc, syncableStore, transact };
//# sourceMappingURL=syncableStore.esm.js.map

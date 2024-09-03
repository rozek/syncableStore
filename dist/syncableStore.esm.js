import { syncedStore, getYjsValue, observeDeep, getYjsDoc as getYjsDoc$1 } from '@syncedstore/core';
export { Box, SyncedArray, SyncedDoc, SyncedMap, SyncedText, SyncedXml, Y, areSame, boxed, getYjsValue } from '@syncedstore/core';

/*******************************************************************************
*                                                                              *
*                                SyncableStore                                 *
*                                                                              *
*******************************************************************************/
/**** syncableStore ****/
var StoreOfRoot = new WeakMap();
function syncableStore(Callback, reportClosestArrayObject, sharedDoc) {
    if (reportClosestArrayObject === void 0) { reportClosestArrayObject = false; }
    var sharedStore = syncedStore({ Root: {} }, sharedDoc);
    var StoreRoot = sharedStore.Root;
    StoreOfRoot.set(StoreRoot, sharedStore);
    StoreEntryOfYjsItem.set(getYjsValue(StoreRoot), StoreRoot);
    if (Callback != null) {
        observeDeep(StoreRoot, function () {
            var ArgList = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                ArgList[_i] = arguments[_i];
            }
            return reportChanges(ArgList[1], StoreRoot, reportClosestArrayObject, Callback);
        });
    }
    return sharedStore.Root;
}
/**** getYjsDoc (modified for syncableStore) ****/
function getYjsDoc(StoreRoot) {
    var Store = StoreOfRoot.get(StoreRoot);
    if (Store == null)
        throw new Error('NoSuchStore: the given object is not a valid "SyncableStore"');
    return getYjsDoc$1(Store);
}
/**** transact (modified for syncableStore) ****/
function transact(StoreRoot, Callback) {
    var YjsDoc = getYjsDoc(StoreRoot);
    if (YjsDoc == null)
        throw new Error('NoYjsDoc: no Yjs document for the given "SyncableStore" found');
    // @ts-ignore TS2345 don't be too strict regarding the function signature
    YjsDoc.transact(Callback);
}
/**** reportChanges ****/
function reportChanges(YjsTransaction, StoreRoot, reportClosestArrayObject, Callback) {
    var Transaction = new Map();
    YjsTransaction.changed.forEach(function (PropertySet, Container) {
        var changedEntry = StoreEntryForYjsItem(Container, StoreRoot);
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
                    for (var _i = 0, PropertySet_1 = PropertySet; _i < PropertySet_1.length; _i++) {
                        var Property = PropertySet_1[_i];
                        var Entry = changedEntry[Property];
                        var YjsItem = getYjsValue(Entry);
                        if (YjsItem != null) {
                            StoreEntryOfYjsItem.set(YjsItem, Entry);
                            memoizeContentsOf(Entry);
                        }
                    }
                    Transaction.set(changedEntry, Array.from(PropertySet.values()).filter(function (Candidate) { return Candidate != null; }));
                }
            }
        }
    });
    Callback(Transaction);
}
/**** StoreEntryForYjsItem ****/
var StoreEntryOfYjsItem = new WeakMap();
function StoreEntryForYjsItem(YjsItem, StoreRoot) {
    var _a, _b, _c;
    var knownEntry = StoreEntryOfYjsItem.get(YjsItem);
    if (knownEntry != null) {
        return knownEntry;
    }
    var outerYjsItem = (((_a = YjsItem._item) === null || _a === void 0 ? void 0 : _a.parent) || ((_b = YjsItem._start) === null || _b === void 0 ? void 0 : _b.parent) || getYjsValue(StoreRoot));
    if (outerYjsItem == null)
        throw new Error('NoRegisteredRoot: the given store root has no Yjs counterpart');
    var outerEntry = StoreEntryOfYjsItem.get(outerYjsItem);
    if (outerEntry == null) {
        return undefined;
    }
    var matchingEntry = undefined;
    if (Array.isArray(outerEntry)) {
        matchingEntry = outerEntry.find(// scan array for changed element
        function (Candidate) { return getYjsValue(Candidate) === YjsItem; });
    }
    else {
        var knownProperty = (_c = YjsItem._item) === null || _c === void 0 ? void 0 : _c.parentSub;
        if (typeof knownProperty === 'string') { // directly access changed item
            matchingEntry = outerEntry[knownProperty];
        }
        else {
            matchingEntry = outerEntry.values().find(// scan object for changed item
            function (Candidate) { return getYjsValue(Candidate) === YjsItem; });
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
    var _a, _b;
    var outerYjsItem = (((_a = YjsItem._item) === null || _a === void 0 ? void 0 : _a.parent) || ((_b = YjsItem._start) === null || _b === void 0 ? void 0 : _b.parent) || getYjsValue(StoreRoot));
    if (outerYjsItem._start == null) {
        var outerEntry_1 = StoreEntryOfYjsItem.get(outerYjsItem);
        var Property = Object.keys(outerEntry_1).find(// scan for prop. with YjsItem
        function (Candidate) { return getYjsValue(outerEntry_1[Candidate]) === YjsItem; });
        Transaction.set(outerEntry_1, [Property]);
    }
    else {
        reportClosestObjectWithArray(outerYjsItem, StoreRoot, Transaction);
    }
}
/**** reportChanges ****/
function memoizeContentsOf(StoreEntry) {
    var EntryList = (Array.isArray(StoreEntry) ? StoreEntry : Object.values(StoreEntry));
    EntryList.forEach(function (Entry) {
        var YjsItem = getYjsValue(Entry);
        if (YjsItem != null) {
            StoreEntryOfYjsItem.set(YjsItem, Entry);
            memoizeContentsOf(Entry);
        }
    });
}

export { getYjsDoc, syncableStore, transact };
//# sourceMappingURL=syncableStore.esm.js.map

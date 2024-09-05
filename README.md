# syncableStore #

small wrapper around [SyncedStore](https://github.com/YousefED/SyncedStore) which enhances change reporting


## Overview ##

From their GitHub repo: "[SyncedStore CRDT](https://github.com/YousefED/SyncedStore) is an easy-to-use library for building live, collaborative applications that sync automatically".

"SyncedStore" looks nice, but it has one major problem: `observeDeep` does not report the number or location of changes applied to a given store. These details may not be necessary for small data sets or trivial applications, but with thousands of store entries and deeply nested data trees observing all entries individually or scanning the store for changes will become too resource intensive.

"syncableStore" therefore adds a small wrapper around `SyncedStore` which enhances the original change reporting and informs you about which of your actual store entries have been modified during a single transaction.

## Installation or Inclusion ##

"syncableStore" can be used with or without a "bundler".

### With a Bundler ###

When used with a bundler, you should first

```
  npm install syncableStore
```

and then (in your code)

```
  import { syncableStore, transact, getYjsDoc } from 'syncableStore'
```

### With a Bundler ###

If you want to go without a bundler and use "syncableStore" directly in your browser, you should include the [syncableStore-bundle](https://github.com/rozek/syncableStore-bundle) rather than the "syncableStore" itself.
You may choose among three alternatives:

* load "syncableStore" as a separate script into a global variable,
* import "syncableStore" into a module script,
* import "syncableStore" into a conventional script.

#### Load "syncableStore" into a global Variable ####

(t.b.w.)

#### Import "syncableStore" into a Script of type "module" ####

(t.b.w.)

#### Import "syncableStore" into a conventional Script ####

(t.b.w.)

## Wrapper ##

"syncableStore" is just a thin wrapper around "SyncedStore" and as such it

* simply passes the "SyncedStore" exports `SyncedDoc`, `SyncedArray`, `SyncedMap`, `SyncedXml`, `SyncedText`, `Box`, `boxed`, `areSame`, `getYjsValue` and `Y`,
* swallows the "SyncedStore" exports `syncedStore` and `observeDeep`,
* modifies the "SyncedStore" exports `getYjsDoc` and
* adds its own exports `syncableStore` and `transact`.

## API ##

"syncableStore"s own API consists of just three functions:

* **`syncableStore (Callback, reportClosestArrayObject, YDoc) ➜ StoreRoot`**<br>creates a new "syncableStore" backed by an underlying "SyncedStore" and returns a "StoreRoot" object which can then be used to identify the store in the functions shown below. It accepts a `Callback`function which is invoked upon completion of every transaction applied to the newly created store and reports any store objects (not their yjs counterparts!) changed during that transaction. `reportClosestArrayObject` is an optional boolean parameter which specifies whether a changed _array_ should be reported itself or the next outer containing map and its parameter instead (see below for an explanation). The optional `YDoc` argument will just be passed to the underlying "syncedStore" factory function and (if given) be used as the `Y.Doc` for the "SyncedStore"/"syncableStore".
* **`getYjsDoc (StoreRoot) ➜ YDoc`**<br>accepts a "StoreRoot" (as returned by `syncableStore`) and returns the `Y.Doc` used to share that store
* **`transact (StoreRoot, Callback)`**<br>runs the given (parameter-less) `Callback` within a transaction on the store given by its `StoreRoot` - which means that all changes (synchronously) applied to the store will be reported in the same syncableStore change reporting callback

## Change Reporting ##

The callback given as first argument of the `syncableStore` factory function has the signature

```
  (ChangeReport:Map<any,string[]>):void
```

It will be invoked with a map whose keys are the changed objects and values are (sometimes empty) lists of property names.

Unfortunately, the indices of changed arrays cannot be determined - as a consequence, changed arrays will be reported with empty property lists and only actual objects ("maps") with property lists that aren't empty.

#### Inspecting Change Reports ###

A simple callback function could look as follows:

```
  function ChangeCallback (ChangeReport) {
    ChangeReport.forEach((PropertyList,StoreEntry) => {
      console.log('changed store entry',StoreEntry, 'changed Properties',PropertyList)
    })
  }
```

Please keep in mind, that **store entries are usually "proxies"** for the actual values you originally entered into the store.

#### reportClosestArrayObject ####

Since array change reports don't include the indices of changed elements and arrays may be difficult to find in a large data set anyway, there is an option to report their container object instead (together with the name of the property containing that array) - this leaves it up to the application to perform an array diff, if necessary.

For nested arrays, the closest containing "map" and the property containing the outermost arrays will be reported.

To give an example: let's say, you have a data model similar to

```
  type Store = {
    [Id:UUID]:{
      EntryIdList:UUID[]
    }
  }
```

and you insert (the UUID of) a new entry into the `EntryIdList` of another one.

Without `reportClosestArrayObject` (or if it was set to `false`), the change report will contain the `EntryIdList` and an empty property list. However, with `reportClosestArrayObject` set to `true`, the report will mention the entry containing the `EntryIdList` and `['EntryIdList']` as its list of changed proeprties.

## Typical Use Case ##

(t.b.w.)

## Build Instructions ##

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/syncableStore/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build

## License ##

[MIT License](LICENSE.md)

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

* **`syncableStore (Callback, reportClosestArrayObject, YDoc) ➜ StoreRoot`**<br>accepts a `Callback`function which is invoked upon completion of every transaction on the newly created store and reports any store objects (not their yjs counterparts!) changed during that transaction. `reportClosestArrayObject` is an optional boolean parameter which specifies whether a changed array should be reported itself or the next outer containing map and its parameter instead (see below for an explanation). The optional `YDoc` argument will just be passed to the underlying "syncedStore" factory function and (if given) be used as the `Y.Doc` for the "SyncedStore"/"syncableStore". The "syncableStore" factory function returns a "StoreRoot" object which can then be used to identify the "syncedStore" in the functions shown below. 
* **`getYjsDoc (StoreRoot) ➜ YDoc`**<br>accepts a "StoreRoot" (as returned by `syncableStore`) and returns the `Y.Doc` used to share that store
* **`transact (StoreRoot, Callback)`**<br>runs the given (parameter-less) `Callback` within a transaction on the store given by its `StoreRoot` - which means that all changes (synchronously) applied to the store will be reported in the same syncableStore change reporting callback

(t.b.w.)

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

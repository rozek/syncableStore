# syncableStore #

small wrapper around [SyncedStore](https://github.com/YousefED/SyncedStore) which enhances change reporting


## Overview ##

From their GitHub repo: "[SyncedStore CRDT](https://github.com/YousefED/SyncedStore) is an easy-to-use library for building live, collaborative applications that sync automatically".

SyncedStore looks nice, but it has one major problem: `observeDeep` does not report the number or location of changes applied to a given store. These details may not be necessary for small data sets or trivial applications, but with thousands of store entries and deeply nested data trees observing all entries individually or scanning the store for changes will become too resource intensive.

`syncableStore` therefore adds a small wrapper around `SyncedStore` which enhances the original change reporting and informs you about which of your actual store entries have been modified during a single transaction.

## Usage ##

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

* load "syncableStore" as a separate script,
* import "syncableStore" into a module script,
* import "syncableStore" into a normal script.

(t.b.w.)

## Wrapper ##

"syncableStore" is just a thin wrapper around "SyncedStore" and as such it

* simply passes the "SyncedStore" exports `SyncedDoc`, `SyncedArray`, `SyncedMap`, `SyncedXml`, `SyncedText`, `Box`, `boxed`, `areSame`, `getYjsValue` and `Y`,
* swallows the "SyncedStore" exports `syncedStore` and `observeDeep`,
* modifies the "SyncedStore" exports `getYjsDoc` and
* adds its own exports `syncableStore` and `transact`.

## API ##

"syncableStore"s own API consists of just three functions:

* **`syncableStore (Callback, reportClosestArrayObject, YDoc)`**<br>
* **`getYjsDoc (StoreRoot)`**<br>
* **`transact (StoreRoot, Callback)`**<br>

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

# syncableStore #

small wrapper around SyncedStore which enhances change reporting

## Overview ##

From their GitHub repo: "[SyncedStore](https://github.com/YousefED/SyncedStore) CRDT is an easy-to-use library for building live, collaborative applications that sync automatically".

SyncedStore looks nice, but it has one major problem: `observeDeep` does not report the number or location of changes applied to a given store. These details may not be necessary for small data sets or trivial applications, but with thousands of store entries and deeply nested data trees observing all entries individually or scanning the store for changes will become too resource intensive.

`syncableStore` therefore adds a small wrapper around `SyncedStore` which enhances the original change reporting and informs you about which store entries have been modified during a single transaction.

## License ##

[MIT License](LICENSE.md)

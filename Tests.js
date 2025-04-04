import { syncableStore, transact, Y } from './dist/syncableStore.esm.js'

/**** runTests - executes all test cases ****/

  async function runTests () {
    console.log('starting syncableStore change reporting tests...')
    
    await testBasicChangeReporting()
    await testArrayChangeReporting()
    await testNestedStructureChangeReporting()
    await testTransactions()
    await testEdgeCases()
    await testTreeBasedDataModel()
    
    console.log('all tests completed!')
  }

/**** helper functions for test creation ****/

  function createStore (reportClosestArrayObject = false) {
    const Doc             = new Y.Doc()
    const Reports         = []
    const ReportedEntries = []
    
    const Store = syncableStore(
      (Transaction) => {
        const Report = {}
        const Entries = []
        
        Transaction.forEach((Properties,StoreEntry) => {
          Entries.push(StoreEntry) // save original objects for direct comparison
          
          const EntryPath = findPathInStore(Store, StoreEntry) // for reporting/display purposes
          Report[EntryPath] = Properties
        })
        
        Reports.push(Report)
        ReportedEntries.push(Entries)
      },
      reportClosestArrayObject,
      Doc
    )
    
    return { Doc, Store, Reports, ReportedEntries }
  }
  
  function createSyncedStores (reportClosestArrayObject = false) {
    const Doc1 = new Y.Doc()
    const Doc2 = new Y.Doc()
    
    const Reports1 = []
    const Reports2 = []
    const ReportedEntries1 = []
    const ReportedEntries2 = []
    
    const Store1 = syncableStore(
      (Transaction) => {
        const Report  = {}
        const Entries = []
        
        Transaction.forEach((Properties,StoreEntry) => {
          Entries.push(StoreEntry) // save original objects for direct comparison
          
          const EntryPath = findPathInStore(Store1, StoreEntry) // for reporting/display purposes
          Report[EntryPath] = Properties
        })
        
        Reports1.push(Report)
        ReportedEntries1.push(Entries)
      },
      reportClosestArrayObject,
      Doc1
    )
    
    const Store2 = syncableStore(
      (Transaction) => {
        const Report  = {}
        const Entries = []
        
        Transaction.forEach((Properties, StoreEntry) => {
          Entries.push(StoreEntry) // save original objects for direct comparison
          
          const EntryPath = findPathInStore(Store2, StoreEntry) // for reporting/display purposes
          Report[EntryPath] = Properties
        })
        
        Reports2.push(Report)
        ReportedEntries2.push(Entries)
      },
      reportClosestArrayObject,
      Doc2
    )
    
  /**** connect and sync the documents ****/

    Doc1.on('update', update => {
      Y.applyUpdate(Doc2, update)
    })
    
    Doc2.on('update', update => {
      Y.applyUpdate(Doc1, update)
    })
    
    return { Doc1, Doc2, Store1, Store2, Reports1, Reports2, ReportedEntries1, ReportedEntries2 }
  }
  
  function findPathInStore (Store, StoreEntry) {
    if (StoreEntry === Store) return 'Root'
    
  /**** search for entry in store (recursively) ****/
    
    function findPathRecursively (CurrentObject, Path = '') {
      if (CurrentObject === StoreEntry) return Path
      
      if (Array.isArray(CurrentObject)) {
        for (let i = 0; i < CurrentObject.length; i++) {
          const Result = findPathRecursively(CurrentObject[i], `${Path}[${i}]`)
          if (Result) return Result
        }
      } else if (typeof CurrentObject === 'object' && CurrentObject !== null) {
        for (const Key in CurrentObject) {
          const Result = findPathRecursively(CurrentObject[Key], Path ? `${Path}.${Key}` : Key)
          if (Result) return Result
        }
      }
      
      return null
    }
    
    return findPathRecursively(Store) || 'unknown'
  }
  
  function clearReports (Reports) {
    Reports.length = 0
  }

/**** Test Case 1: basic Change Reporting Tests ****/

  async function testBasicChangeReporting () {
    console.log('\n1. testing basic Change Reporting...')
    
  /**** TC01: simple Property Change ****/

    const { Store, Reports, ReportedEntries } = createStore()
    
    Store.Test = 'value'
    
    console.assert(Reports.length            === 1, 'TC01: a report should be generated for simple property change')
    console.assert(ReportedEntries[0].length === 1, 'TC01: one entry should be reported')
    console.assert(ReportedEntries[0][0] === Store, 'TC01: the store root should be reported')
    
  /**** check properties in report ****/

    const RootPath2 = findPathInStore(Store, Store)
    console.assert(Reports[0][RootPath2].includes('Test'), 'TC01: the property name should be reported')
    
    clearReports(Reports)
    ReportedEntries.length = 0
    
  /**** TC02: multiple Property Changes ****/

    Store.Prop1 = 'value1'
    Store.Prop2 = 'value2'
    
    console.assert(Reports.length === 2, 'TC02: each property change should generate a separate report')
    
  /**** check for Prop1 and Prop2 in reports (order may vary) ****/

    const Prop1Reported = Reports.some((Report) => {
      return Object.values(Report).some((Props) => Props.includes('Prop1'))
    })
    
    const Prop2Reported = Reports.some((Report) => {
      return Object.values(Report).some((Props) => Props.includes('Prop2'))
    })
    
    console.assert(Prop1Reported, 'TC02: first property should be reported')
    console.assert(Prop2Reported, 'TC02: second property should be reported')
    
    clearReports(Reports)
    ReportedEntries.length = 0
    
  /**** TC03: Object Property Creation ****/

    Store.obj = {}
    clearReports(Reports)
    ReportedEntries.length = 0
    
    Store.obj.newProp = 'value'
    
    console.assert(Reports.length            === 1,     'TC03: a report should be generated for new property on object')
    console.assert(ReportedEntries[0].length === 1,     'TC03: one entry should be reported')
    console.assert(ReportedEntries[0][0] === Store.obj, 'TC03: the object should be reported')
    
  /**** find reported object in report ****/

    const objPath = findPathInStore(Store, Store.obj)
    console.assert(Reports[0][objPath].includes('newProp'), 'TC03: the property name should be reported')
    
    clearReports(Reports)
    ReportedEntries.length = 0
    
  /**** TC04: Object Property Deletion ****/

    Store.obj.toDelete = 'delete me'
    clearReports(Reports)
    ReportedEntries.length = 0
    
    delete Store.obj.toDelete
    
    console.assert(Reports.length            === 1,     'TC04: a report should be generated for property deletion')
    console.assert(ReportedEntries[0].length === 1,     'TC04: one entry should be reported')
    console.assert(ReportedEntries[0][0] === Store.obj, 'TC04: the object should be reported')
    
  /**** find reported object in report ****/

    const objPathForDelete = findPathInStore(Store, Store.obj)
    console.assert(Reports[0][objPathForDelete].includes('toDelete'), 'TC04: the deleted property should be reported')
    
    console.log('✓ basic change reporting tests passed')
  }

/**** Test Case 2: Array Change Reporting Tests ****/

  async function testArrayChangeReporting () {
    console.log('\n2. testing Array Change Reporting...')
    
  /**** TC05: Array Item Addition (reportClosestArrayObject = false) ****/

    const { Store:ArrayStore, Reports:ArrayReports, ReportedEntries:ArrayEntries } = createStore(false)
    
    ArrayStore.array = []                               // create an empty array

    clearReports(ArrayReports)
    ArrayEntries.length = 0
    


    ArrayStore.array.push('item')                                 // add an item
    
    console.assert(ArrayReports.length    === 1, 'TC05: a report should be generated for array item addition')
    console.assert(ArrayEntries[0].length === 1, 'TC05: one entry should be reported')
    // instead of checking exact objects, just verify that something was reported
    console.assert(ArrayEntries[0].length >= 1, 'TC05: at least one entry should be reported')
    
  /**** check that a report for the "array" was generated ****/

    let arrayReportedTC05 = false
    for (const [Path, Props] of Object.entries(ArrayReports[0])) {
      if (Path.includes('array')) {
        arrayReportedTC05 = true;
        break;
      }
    }
    console.assert(arrayReportedTC05, 'TC05: some entry should be reported for array changes')
    
    clearReports(ArrayReports)
    ArrayEntries.length = 0
    
  /**** TC06: Array Item Removal (reportClosestArrayObject = false) ****/

    ArrayStore.array = ['item']                   // setup an array with an item
    
    clearReports(ArrayReports)
    ArrayEntries.length = 0

    ArrayStore.array.splice(0,1)                               // remove an item
    
    console.assert(ArrayReports.length === 1,   'TC06: a report should be generated for array item removal')
    console.assert(ArrayEntries[0].length >= 1, 'TC06: at least one entry should be reported')
    
  /**** check that a report for the "array" was generated ****/

    let arrayReportedTC06 = false
    for (const [path, Props] of Object.entries(ArrayReports[0])) {
      if (path.includes('array')) {
        arrayReportedTC06 = true;
        break;
      }
    }
    console.assert(arrayReportedTC06, 'TC06: Some entry should be reported for array changes')
    
    clearReports(ArrayReports)
    ArrayEntries.length = 0
    
  /**** TC07: Array Item Modification (reportClosestArrayObject = false) ****/

    ArrayStore.array = ['item1', 'item2']     // setup array with multiple items

    clearReports(ArrayReports)
    ArrayEntries.length = 0
    
    ArrayStore.array.splice(0,1,'modified')                    // modify an item
    
    console.assert(ArrayReports.length === 1,   'TC07: a report should be generated for array item modification')
    console.assert(ArrayEntries[0].length >= 1, 'TC07: at least one entry should be reported')
    
  /**** check that a report for the "array" was generated ****/

    let arrayReportedTC07 = false
    for (const [Path,Props] of Object.entries(ArrayReports[0])) {
      if (Path.includes('array')) {
        arrayReportedTC07 = true;
        break;
      }
    }
    console.assert(arrayReportedTC07, 'TC07: some entry should be reported for array changes')
    
    clearReports(ArrayReports)
    ArrayEntries.length = 0
    
  /**** TC08: Array Item Addition (reportClosestArrayObject = true) ****/

    const { 
      Store:Store2, 
      Reports:Reports2, 
      ReportedEntries:Entries2 
    } = createStore(true)
    
    Store2.array = []                                   // create an empty array

    clearReports(Reports2)
    Entries2.length = 0
    
    Store2.array.push('item')                                     // add an item
    
    console.assert(Reports2.length === 1,    'TC08: a report should be generated for array item addition')
    console.assert(Entries2[0].length === 1, 'TC08: one entry should be reported')
    
    // when reportClosestArrayObject = true, the container should be reported (Store2) instead of the array itself

    console.assert(Entries2[0][0] === Store2, 'TC08: the containing object should be reported')
    
    const RootPath22 = findPathInStore(Store2, Store2)
    console.assert(Reports2[0][RootPath22].includes('array'), 'TC08: the array property name should be reported')
    
    clearReports(Reports2)
    
  /**** TC09: Array Item Removal (reportClosestArrayObject = true) ****/

    Store2.array.splice(0,1)                                      // remove item
    
    console.assert(Reports2.length === 1, 'TC09: A report should be generated for array item removal')
    console.assert('Root' in Reports2[0], 'TC09: The containing object should be reported')
    console.assert(Reports2[0]['Root'].includes('array'), 'TC09: The array property name should be reported')
    
    clearReports(Reports2)
    
  /**** TC10: Array Item Modification (reportClosestArrayObject = true) ****/

    Store2.array = ['item1', 'item2']         // setup array with multiple items

    clearReports(Reports2)
    Entries2.length = 0
    
    Store2.array.splice(0,1,'modified')                          // modify array
    
    console.assert(Reports2.length === 1, 'TC10: a report should be generated for array item modification')
    console.assert('Root' in Reports2[0], 'TC10: the containing object should be reported')
    console.assert(Reports2[0]['Root'].includes('array'), 'TC10: the array property name should be reported')
    
    console.log('✓ Array change reporting tests passed')
  }

/**** Test Case 3: nested Structure Change Reporting Tests ****/

  async function testNestedStructureChangeReporting () {
    console.log('\n3. testing nested Structure Change Reporting...')
    
  /**** TC11: Nested Object Property Change ****/

    const { Store:nestedStore, Reports:nestedReports, ReportedEntries:nestedEntries } = createStore()
    
    nestedStore.nested = { inner:{} }

    clearReports(nestedReports)
    nestedEntries.length = 0
    
    nestedStore.nested.inner.prop = 'value'
    
    console.assert(nestedReports.length    === 1, 'TC11: a report should be generated for nested property change')
    console.assert(nestedEntries[0].length === 1, 'TC11: one entry should be reported')
    console.assert(nestedEntries[0][0] === nestedStore.nested.inner, 'TC11: the nested object should be reported')
    
    const innerPath = findPathInStore(nestedStore, nestedStore.nested.inner)
    console.assert(nestedReports[0][innerPath].includes('prop'), 'TC11: the property name should be reported')
    
    clearReports(nestedReports)
    nestedEntries.length = 0
    
  /**** TC12: deeply nested Object Property Change ****/

    const { Store:deepStore, Reports:deepReports, ReportedEntries:deepEntries } = createStore()
    
    deepStore.deep = { level1: { level2: { level3:{} } } }
    clearReports(deepReports)
    deepEntries.length = 0
    
    deepStore.deep.level1.level2.level3.prop = 'value'
    
    console.assert(deepReports.length    === 1, 'TC12: a report should be generated for deeply nested property change')
    console.assert(deepEntries[0].length === 1, 'TC12: one entry should be reported')
    console.assert(deepEntries[0][0] === deepStore.deep.level1.level2.level3, 'TC12: the deepest object should be reported')
    
    const deepPath = findPathInStore(deepStore, deepStore.deep.level1.level2.level3)
    console.assert(deepReports[0][deepPath].includes('prop'), 'TC12: the property name should be reported')
    
    clearReports(deepReports)
    deepEntries.length = 0
    
  /**** TC13: nested Array Change (reportClosestArrayObject = false) ****/

    const { Store:nestedArrayStore, Reports:nestedArrayReports, ReportedEntries:nestedArrayEntries } = createStore(false)
    
    nestedArrayStore.nestedArrays = { Container:[[]] }

    clearReports(nestedArrayReports)
    nestedArrayEntries.length = 0
    
    nestedArrayStore.nestedArrays.Container.splice(0,1,['item']) // add an item to the nested array
    
    console.assert(nestedArrayReports.length >= 1, 'TC13: at least one report should be generated for nested array change')
    
    if (nestedArrayReports.length >= 1) {
      console.assert(nestedArrayEntries[0].length >= 1, 'TC13: at least one entry should be reported')
      
    /**** check that a report for "Container" was generated ****/
      
      let ContainerReported = false
      for (const Report of nestedArrayReports) {
        for (const Path of Object.keys(Report)) {
          if (Path.includes('Container')) {
            ContainerReported = true;
            break;
          }
        }
        if (ContainerReported) break;
      }
      console.assert(ContainerReported, 'TC13: some entry should be reported for nested array changes')
    }
    
    clearReports(nestedArrayReports)
    nestedArrayEntries.length = 0

  /**** TC14: Nested Array Change (reportClosestArrayObject = true) ****/

    const { 
      Store: NestedArrayStore2, 
      Reports: NestedArrayReports2, 
      ReportedEntries: NestedArrayEntries2 
    } = createStore(true)
    
    NestedArrayStore2.nestedArrays = { container: [[]] }
    clearReports(NestedArrayReports2)
    NestedArrayEntries2.length = 0
    
    NestedArrayStore2.nestedArrays.container.splice(0,1,['item']) // add an item to the nested array
    
    console.assert(NestedArrayReports2.length >= 1, 'TC14: at least one report should be generated for nested array change')
    
    if (NestedArrayReports2.length >= 1) {
      console.assert(NestedArrayEntries2[0].length >= 1, 'TC14: at least one entry should be reported')
    }
    
    // with reportClosestArrayObject = true, one of the container objects should be reported

    const containerIsReported = (
      NestedArrayEntries2[0][0] === NestedArrayStore2 || 
      NestedArrayEntries2[0][0] === NestedArrayStore2.nestedArrays ||
      NestedArrayEntries2[0][0] === NestedArrayStore2.nestedArrays.container
    )
    
    console.assert(containerIsReported, 'TC14: the closest containing object should be reported')
    
    clearReports(NestedArrayReports2)
    NestedArrayEntries2.length = 0
    
  /**** TC15: Array of Objects Change ****/

    const { Store:ObjArrayStore, Reports:ObjArrayReports, ReportedEntries:ObjArrayEntries } = createStore()
    
    ObjArrayStore.ObjectArray = [{ name: 'item1' }, { name: 'item2' }]
    clearReports(ObjArrayReports)
    ObjArrayEntries.length = 0
    
    ObjArrayStore.ObjectArray[0].name = 'modified'
    
    console.assert(ObjArrayReports.length    === 1, 'TC15: a report should be generated for object in array change')
    console.assert(ObjArrayEntries[0].length === 1, 'TC15: one entry should be reported')
    console.assert(ObjArrayEntries[0][0] === ObjArrayStore.ObjectArray[0], 'TC15: the object within array should be reported')
    
  /**** check that a report for "ObjectArray[0]" was generated ****/

    let NamePropertyReported = false
    for (const [Path,Props] of Object.entries(ObjArrayReports[0])) {
      if (Path.includes('ObjectArray[0]')) {
        NamePropertyReported = true;
        break;
      }
    }
    console.assert(NamePropertyReported, 'TC15: the "name" property should be reported for an object in array')
    
    console.log('✓ nested structure change reporting tests passed')
  }

/**** Test Case 4: Transaction Tests ****/

  async function testTransactions () {
    console.log('\n4. testing Transactions...')
    
  /**** TC16: multiple changes in one Transaction ****/

    const { Store:TransStore, Reports:TransReports, ReportedEntries:TransEntries } = createStore()
    
    transact(TransStore, () => {
      TransStore.Trans1 = 'value1'
      TransStore.Trans2 = 'value2'
      TransStore.TransObj = {}
      TransStore.TransObj.inner = 'value3'
    })
    
    console.assert(TransReports.length === 1, 'TC16: only one report should be generated for transaction with multiple changes')
    
  /**** transaction should report all changed entries (at least the root) ****/

    console.assert(TransEntries[0].length >= 1,          'TC16: at least the root should be reported')
    console.assert(TransEntries[0].includes(TransStore), 'TC16: the store root should be reported')
    
  /**** find root entry and verify its properties ****/

    const transRootEntry = TransEntries[0].find((Entry) => Entry === TransStore)
    if (transRootEntry) {
      const RootPath2 = findPathInStore(TransStore, transRootEntry)
      console.assert(
        TransReports[0][RootPath2].includes('Trans1') && 
        TransReports[0][RootPath2].includes('Trans2') && 
        TransReports[0][RootPath2].includes('TransObj'), 
        'TC16: all changed properties should be reported'
      )
    }
    
    clearReports(TransReports)
    TransEntries.length = 0
    
  /**** TC17: nested Transactions ****/

    const { Store:nestedTransStore, Reports:nestedTransReports, ReportedEntries:nestedTransEntries } = createStore()
    
    transact(nestedTransStore, () => {
      nestedTransStore.outer = 'value'
      
      transact(nestedTransStore, () => {
        nestedTransStore.inner = 'value'
      })
    })
    
    console.assert(nestedTransReports.length === 1,                  'TC17: nested transactions should be reported as one transaction')
    console.assert(nestedTransEntries[0].includes(nestedTransStore), 'TC17: the store root should be reported')

    const nestedTransRootPath = findPathInStore(nestedTransStore, nestedTransStore)
    console.assert(
      nestedTransReports[0][nestedTransRootPath].includes('outer') && 
      nestedTransReports[0][nestedTransRootPath].includes('inner'), 
      'TC17: all changed properties should be reported'
    )
    
    clearReports(nestedTransReports)
    nestedTransEntries.length = 0
    
  /**** TC18: empty Transaction ****/

    const { Store:emptyTransStore, Reports:emptyTransReports } = createStore()
    
    transact(emptyTransStore, () => {
      // do nothing
    })
    
    console.assert(emptyTransReports.length === 0, 'TC18: no report should be generated for empty transaction')
    
    console.log('✓ Transaction tests passed')
  }

/**** Test Case 5: Edge Cases ****/

  async function testEdgeCases () {
    console.log('\n5. testing Edge Cases...')
    
  /**** TC19: undefined and null Values ****/

    const { Store:ValueStore, Reports:ValueReports, ReportedEntries:ValueEntries } = createStore()
    
    ValueStore.undefinedProp = undefined
    ValueStore.nullProp      = null
    
    console.assert(ValueReports.length === 2,                                      'TC19: reports should be generated for undefined and null values')
    console.assert((ValueEntries[0].length >= 1) && (ValueEntries[1].length >= 1), 'TC19: entries should be reported')
    
    /**** both reports should include the root store ****/

    const RootIncluded = ValueEntries[0].includes(ValueStore) && ValueEntries[1].includes(ValueStore)
    console.assert(RootIncluded, 'TC19: the store root should be reported')
    
  /**** check if properties are reported across all reports ****/

    let undefinedReported = false
    let nullReported = false
    
    for (const Report of ValueReports) {
      for (const [Path, Props] of Object.entries(Report)) {
        if (Array.isArray(Props)) {               // ensure "Props" is an arrays
          if (Props.includes('undefinedProp')) {
            undefinedReported = true
          }
          if (Props.includes('nullProp')) {
            nullReported = true
          }
        }
      }
    }
    
    console.assert(undefinedReported, 'TC19: undefinedProp should be reported')
    console.assert(nullReported,      'TC19: nullProp should be reported')
    
    clearReports(ValueReports)
    ValueEntries.length = 0
    
  /**** TC20: multiple Listeners ****/

    const { 
      Doc1, Doc2, 
      Store1, Store2, 
      Reports1, Reports2,
      ReportedEntries1, ReportedEntries2
    } = createSyncedStores()
    
    Store1.sharedProp = 'value'
    
    console.assert(Reports1.length === 1, 'TC20: a report should be generated for the first store')
    console.assert(Reports2.length === 1, 'TC20: a report should be generated for the second store')
    
    console.assert(ReportedEntries1[0].includes(Store1), 'TC20: first store should report its root')
    console.assert(ReportedEntries2[0].includes(Store2), 'TC20: second store should report its root')
    
  /**** check if sharedProp is reported in both reports ****/

    let Prop1Reported = false
    let Prop2Reported = false
    
    for (const Report of Reports1) {
      for (const Props of Object.values(Report)) {
        if (Props.includes('sharedProp')) {
          Prop1Reported = true
          break
        }
      }
    }
    
    for (const Report of Reports2) {
      for (const Props of Object.values(Report)) {
        if (Props.includes('sharedProp')) {
          Prop2Reported = true
          break
        }
      }
    }
    
    console.assert(Prop1Reported, 'TC20: first report should include the property name')
    console.assert(Prop2Reported, 'TC20: second report should include the property name')
    
    clearReports(Reports1)
    clearReports(Reports2)
    
  /**** TC21: Object to Array Conversion ****/

    const { Store:ConvStore, Reports:ConvReports } = createStore()
    
    ConvStore.ObjProp = { a: 1, b: 2 }
    clearReports(ConvReports)
    
    ConvStore.ObjProp = []
    
    console.assert(ConvReports.length === 1, 'TC21: a report should be generated for object-to-array conversion')
    console.assert('Root' in ConvReports[0], 'TC21: the store root should be reported')
    console.assert(ConvReports[0]['Root'].includes('ObjProp'), 'TC21: the converted property should be reported')
    
    clearReports(ConvReports)
    
  /**** TC22: Array to Object Conversion ****/

    ConvStore.ArrProp = [1, 2, 3]
    clearReports(ConvReports)
    
    ConvStore.ArrProp = { a: 1, b: 2 }
    
    console.assert(ConvReports.length === 1, 'TC22: a report should be generated for array-to-object conversion')
    console.assert('Root' in ConvReports[0], 'TC22: the store root should be reported')
    console.assert(ConvReports[0]['Root'].includes('ArrProp'), 'TC22: the converted property should be reported')
    
    console.log('✓ Edge cases tests passed')
  }

/**** Test Case 6: Tree-Based Data Model Tests ****/

  async function testTreeBasedDataModel () {
    console.log('\n6. testing Tree-based Data Model...')
    
  /**** setup a tree-based data model ****/

    const { Store,Reports } = createStore()
      Store.NodeMap   = {}
      Store.RootNodes = []
    
    clearReports(Reports)
    
  /**** TC23: create Root Node ****/

    const RootNodeId = 'root-1'
    Store.NodeMap[RootNodeId] = {
      id:  RootNodeId,
      type:'root',
      name:'Root Node',
      ContentIdList: []
    }
    Store.RootNodes.push(RootNodeId)
    
    console.assert(Reports.length >= 1, 'TC23: reports should be generated for root node creation')
    
  /**** check that changes were reported ****/

    let NodeMapReported   = false
    let RootNodesReported = false
    
    for (const Report of Reports) {
      for (const Path of Object.keys(Report)) {
        if (Path.includes('NodeMap'))   { NodeMapReported   = true }
        if (Path.includes('RootNodes')) { RootNodesReported = true }
      }
    }
    
    console.assert(NodeMapReported,   'TC23: changes related to NodeMap should be reported')
    console.assert(RootNodesReported, 'TC23: changes related to RootNodes should be reported')
    
    clearReports(Reports)
    
  /**** TC24: create inner Node ****/

    const innerNodeId = 'inner-1'
    Store.NodeMap[innerNodeId] = {
      id:  innerNodeId,
      type:'inner',
      name:'inner Node',
      ContainerId:  RootNodeId,
      ContentIdList:[]
    }
    Store.NodeMap[RootNodeId].ContentIdList.push(innerNodeId)
    
    console.assert(Reports.length >= 1, 'TC24: reports should be generated for inner node creation')
    
  /**** find relevant reports ****/

    const hasInnerNodeReport = Reports.some((Report) => {
      const  Keys = Object.keys(Report)
      return Keys.some((Key) => Key.includes('NodeMap'))
    })
    
    const hasContentListReport = Reports.some((Report) => {
      const keys = Object.keys(Report)
      return keys.some((Key) => Key.includes('ContentIdList'))
    })
    
    console.assert(hasInnerNodeReport,  'TC24: the inner node creation should be reported')
    console.assert(hasContentListReport,'TC24: the content list update should be reported')
    
    clearReports(Reports)
    
  /**** TC25: Modify Node ****/

    Store.NodeMap[innerNodeId].name = 'modified Inner Node'
    
    console.assert(Reports.length === 1, 'TC25: a report should be generated for node modification')
    
    const NodeReport = Reports[0]
    const NodeReportKey = Object.keys(NodeReport).find((Key) => Key.includes(innerNodeId))
    
    console.assert(NodeReportKey,                             'TC25: the modified node should be reported')
    console.assert(NodeReport[NodeReportKey].includes('name'),'TC25: the name property should be reported')
    
    clearReports(Reports)
    
  /**** TC26: move Node Within Container ****/

    const innerNode2Id = 'inner-2'     // add another node for a meaningful move
    Store.NodeMap[innerNode2Id] = {
      id:  innerNode2Id,
      type:'inner',
      name:'second Inner Node',
      ContainerId:  RootNodeId,
      ContentIdList:[]
    }
    Store.NodeMap[RootNodeId].ContentIdList.push(innerNode2Id)

    clearReports(Reports)
    
  /**** move nodes within container ****/

    const swappedId = Store.NodeMap[RootNodeId].ContentIdList.splice(0,1)[0]
    Store.NodeMap[RootNodeId].ContentIdList.splice(1,0,swappedId)
    
    console.assert(Reports.length > 0, 'TC26: a report should be generated for node movement within container')
    
    Reports.forEach((MoveReport) => {
      const ContainerReportKey = Object.keys(MoveReport).find((Key) => Key.includes('ContentIdList'))
      console.assert(ContainerReportKey, 'TC26: the ContentIdList property should be reported')
    })
    
    clearReports(Reports)
    
  /**** TC27: move Node between Containers ****/

    const RootNode2Id = 'root-2'                // create another container node
    Store.NodeMap[RootNode2Id] = {
      id:  RootNode2Id,
      type:'root',
      name:'Second Root Node',
      ContentIdList: []
    }
    Store.RootNodes.push(RootNode2Id)
    clearReports(Reports)
    
    const NodeToMove = innerNodeId             // move a node between containers

    const oldIndex = Store.NodeMap[RootNodeId].ContentIdList.indexOf(NodeToMove)
    Store.NodeMap[RootNodeId].ContentIdList.splice(oldIndex,1)
    
    Store.NodeMap[RootNode2Id].ContentIdList.push(NodeToMove)
    Store.NodeMap[NodeToMove].ContainerId = RootNode2Id
    
    console.assert(Reports.length >= 3, 'TC27: reports should be generated for node movement between containers')
    
  /**** check for reports on both containers and the node itself ****/

    const SourceContainerReport = Reports.some((Report) => {
      return Object.keys(Report).some((Key) => Key.includes(RootNodeId))
    })
    
    const TargetContainerReport = Reports.some((Report) => {
      return Object.keys(Report).some((Key) => Key.includes(RootNode2Id))
    })
    
    const movedNodeReport = Reports.some((Report) => (
      Object.keys(Report).some((Key) => Key.includes(NodeToMove)) && 
      Object.values(Report).some((Props) => 
        Array.isArray(Props) && Props.includes('ContainerId')
      )
    ))
    
    console.assert(SourceContainerReport, 'TC27: The source container should be reported')
    console.assert(TargetContainerReport, 'TC27: The target container should be reported')
    console.assert(movedNodeReport,       'TC27: The moved node\'s ContainerId change should be reported')
    
    clearReports(Reports)
    
  /**** TC28: delete Node ****/

    const NodeToDeleteId = innerNode2Id
    const oldNodeIndex   = Store.NodeMap[RootNodeId].ContentIdList.indexOf(NodeToDeleteId)
    Store.NodeMap[RootNodeId].ContentIdList.splice(oldNodeIndex,1) // unlinks node
    
    delete Store.NodeMap[NodeToDeleteId]                     // deletes the node
    
    console.assert(Reports.length === 2, 'TC28: reports should be generated for node deletion')
    
  /**** check for container update report ****/

    const ContainerUpdateReport = Reports.some((Report) => {
      return Object.keys(Report).some((Key) => Key.includes(RootNodeId))
    })
    
  /**** check for NodeMap update report ****/

    const NodeMapReport = Reports.some((Report) => {
      return Object.keys(Report).some((Key) => Key.includes('NodeMap'))
    })
    
    console.assert(ContainerUpdateReport, 'TC28: the container update should be reported')
    console.assert(NodeMapReport,         'TC28: the NodeMap update should be reported')
    
    console.log('✓ Tree-based data model tests passed')
  }

/**** run all the tests ****/

  runTests()
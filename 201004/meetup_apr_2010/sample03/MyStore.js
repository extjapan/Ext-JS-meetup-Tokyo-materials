/*
 * File: MyStore.js
 * Date: Wed Apr 21 2010 11:35:09 GMT+0900 (JST)
 * 
 * This file was generated by Ext Designer version xds-1.0.0.8.
 * http://www.extjs.com/products/designer/
 *
 * This file will be auto-generated each and everytime you export.
 *
 * Do NOT hand edit this file.
 */

MyStore = Ext.extend(Ext.data.JsonStore, {
    constructor: function(cfg) {
        cfg = cfg || {};
        MyStore.superclass.constructor.call(this, Ext.apply({
            storeId: 'MyStore',
            url: 'data.json',
            autoLoad: true,
            fields : [
            {
                name: 'id'
            },
            {
                name: 'name'
            },
            {
                name: 'desc'
            }
        ]
        }, cfg));
    }
});
new MyStore();
/*
 * File: MyViewport.ui.js
 * Date: Wed Apr 21 2010 11:35:09 GMT+0900 (JST)
 * 
 * This file was generated by Ext Designer version xds-1.0.0.8.
 * http://www.extjs.com/products/designer/
 *
 * This file will be auto-generated each and everytime you export.
 *
 * Do NOT hand edit this file.
 */

MyViewportUi = Ext.extend(Ext.Viewport, {
    layout: 'border',
    initComponent: function() {
        this.items = [
            {
                xtype: 'tabpanel',
                activeTab: 1,
                region: 'center',
                split: true,
                title: 'Center',
                items: [
                    {
                        xtype: 'form',
                        title: 'Form',
                        labelWidth: 100,
                        labelAlign: 'left',
                        layout: 'form'
                    },
                    {
                        xtype: 'grid',
                        title: 'My Grid',
                        store: 'MyStore',
                        viewConfig: {
                            forceFit: true
                        },
                        columns: [
                            {
                                xtype: 'gridcolumn',
                                header: 'ID',
                                sortable: true,
                                resizable: true,
                                width: 100,
                                dataIndex: 'id'
                            },
                            {
                                xtype: 'gridcolumn',
                                header: 'Name',
                                sortable: true,
                                resizable: true,
                                width: 100,
                                dataIndex: 'name'
                            },
                            {
                                xtype: 'gridcolumn',
                                header: 'Description',
                                sortable: true,
                                resizable: true,
                                width: 100,
                                dataIndex: 'desc'
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'treepanel',
                title: 'My Tree',
                region: 'west',
                width: 209,
                split: true,
                root: {
                    text: 'Root Node'
                },
                loader: {
                    url: 'tree.json'
                }
            }
        ];
        MyViewportUi.superclass.initComponent.call(this);
    }
});

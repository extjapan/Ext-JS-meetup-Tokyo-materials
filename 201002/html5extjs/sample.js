/*
 * Copyright (c) 2010 Y.Tokutomi at Degino Inc.
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

// ************************
// ライブラリ
// ************************
Ext.ns('Dgn');

// iframe
Dgn.IframePanel = Ext.extend(Ext.Panel, {
	// 初期化
	initComponent:	function() {
		var config = {
			width:	'100%',
			height:	'100%'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.IframePanel.superclass.initComponent.call(this);

		// attach events
		this.on({
			render:		this._render,
			bodyresize: function(panel, width, height) {
			    if (this.iframe) this.iframe.setSize(width, height);
			}
		});
	},

	// レンダリング
	_render: function() {
		var size = this.getSize();
	    var cfg = Ext.copyTo({
	      tag :		'iframe',
//	      width:	size.width,
//	      height:	size.height,
	      src:		this.src
	    },
	    this, 'poster,start,loopstart,loopend,playcount,autobuffer,loop');

	    this.iframe = this.body.createChild(cfg);
	}
});
Ext.reg('dgniframe', Dgn.IframePanel);

// canvas
Dgn.Canvas = Ext.extend(Ext.Panel, {
	// 初期化
	initComponent:	function() {
		var config = {
			width:	'100%',
			height:	'100%'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Canvas.superclass.initComponent.call(this);

		// attach events
		this.on({
			scope:		this,
			render:		this._render,
			bodyresize: function(panel, width, height) {
			    if (this.canvas) this.canvas.setSize(width, height);
			}
		});
	},

	// レンダリング
	_render: function(cmp) {
/*
		var size	= cmp.getSize();
	    this.canvas = this.body.createChild({tag: 'canvas', width: size.width, height: size.height});
*/
	    this.canvas = this.body.createChild({tag: 'canvas', width: 600, height: 600});
	    this.ctx	= this.canvas.dom.getContext('2d');
	}
});
Ext.reg('dgncanvas', Dgn.Canvas);

// ************************
// アプリケーションクラス
// ************************
SampleApp = function() {
	SampleApp.superclass.constructor.apply(this, arguments);	

	// 各種アプリケーション設定
	var cp = new Ext.state.CookieProvider();
	Ext.state.Manager.setProvider(cp);
	Ext.form.Field.prototype.msgTarget = 'side';
	Ext.QuickTips.init();
};

Ext.extend(SampleApp, Ext.util.Observable, {

initApp: function() {
},

_initCanvas: function() {
	var me = this;

	var pnl = new Dgn.Canvas({
		id:	'sample',
		tbar: [
			'->',
			{text: 'Box', handler: function() {
				var	ctx = pnl.ctx;

				ctx.beginPath();
				ctx.moveTo(20, 20);
				ctx.lineTo(120, 20);
				ctx.lineTo(120, 120);
				ctx.lineTo(20, 120);
				ctx.closePath();
				ctx.stroke();
			}},
			{text: 'Circle', handler: function() {
				var	ctx = pnl.ctx;

				ctx.beginPath();
				ctx.arc(120, 120, 60, 10 * Math.PI / 180, 80 * Math.PI / 180, true);
				ctx.fill();
			}},
			{text: 'Radar', handler: function() {
				var rc = new html5jp.graph.radar(pnl.canvas.id);
				if( ! rc ) { return; }
				var items = [
					["商品A", 5, 2, 4, 5, 3, 2, 4, 4],
					["商品B", 3, 4, 3, 4, 5, 4, 5, 1]
				];
				var params = {
					aCap: ["安さ", "性能", "デザイン", "人気", "使いやすさ", "寿命", "軽さ", "強さ"]
				};
				rc.draw(items, params);
			}}
		]
	});

	return pnl;
},

_initForm1: function() {
	var pnl = new Ext.form.FormPanel({
		frame:	true,
		defaults:	{
			width:	200
		},
		items:	[
			{xtype: 'textfield',	fieldLabel:	'文字列',	allowBlank: false},
			{xtype: 'numberfield',	fieldLabel:	'数値',	allowBlank: false},
			{xtype: 'textfield',	fieldLabel:	'文字列 (URL)',	vtype: 'url'},
			{xtype: 'textfield',	fieldLabel:	'文字列 (Email)',	vtype: 'email'},
			{xtype: 'datefield',	fieldLabel:	'日付'},
			{xtype: 'timefield',	fieldLabel:	'時刻'},
			{xtype: 'fieldset',		title: 'フィールドセット',	collapsible: true, width: 400,	items: [
				{xtype: 'colorpalette',	fieldLabel: '色'},
				{xtype: 'checkboxgroup',fieldLabel: 'チェック',	columns: 2,	items:[
					{boxLabel: 'チェック 1'},
					{boxLabel: 'チェック 2'},
					{boxLabel: 'チェック 3'},
					{boxLabel: 'チェック 4'}
				]}
			]}
		],
		fbar: [
			{text: '送信', handler: function() {
				pnl.getForm().submit();
			}}
		]
	});

	return pnl;
},

show: function() {
	var view = new Ext.Viewport({
		layout:		'accordion',
		layoutConfig:	{
			animate:	true
		},
		items: [{
			title:	'Form Sample',
			layout:	'border',
			defaults:	{
				layout:			'fit'
			},
			items:	[{
				region:			'west',
				title:			'Ext JS',
				width:			'50%',
				split:			true,
				collapsible:	true,
//				collapsed:		true,
				items:			[this._initForm1()]
			}, {
				region:			'center',
				title:			'HTML5',
				padding:		10,
				contentEl:		'html5form'
			}]
		}, {
			xtype:	'dgniframe',
			title:	'WebKit Demo 1 (iframe)',
			src:	'snow.html'
		}, {
			xtype:	'dgniframe',
			title:	'Canvas Demo 1 (iframe)',
			src:	'http://www.watersheep.org/~markh/html_canvas/game.html'
		}, {
			xtype:	'dgniframe',
			title:	'Canvas Demo 2 (iframe)',
			src:	'http://29a.ch/jswars/'
		}, {
			xtype:	'dgniframe',
			title:	'Canvas Demo 3 (irame)',
			src:	'http://www.benjoffe.com/code/demos/canvascape/'
		}, {
			xtype:	'dgniframe',
			title:	'Canvas Demo 4 (iframe)',
			src:	'http://mugtug.com/sketchpad/'
		}, {
			title:	'Canvas Demo 5 (Ext JS Canvas Panel)',
			layout:	'fit',
			items:	[this._initCanvas()]
		}]
	});
}

});

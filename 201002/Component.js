Ext.Component = function(config){
    config = config || {};
		// Ext.Actionを利用するComponent（Buttonなど）あるいはComponentをクローンする場合
    if(config.initialConfig){
        if(config.isAction){           // actions
            this.baseAction = config;
        }
        config = config.initialConfig; // component cloning / action set up
		// Elementが渡された場合
    }else if(config.tagName || config.dom || Ext.isString(config)){ // element object
        config = {applyTo: config, id: config.id || config};
    }

		// 初期コンフィグを保存
    this.initialConfig = config;

		// コンフィグをコピー
    Ext.apply(this, config);

		// イベントを定義
    this.addEvents(
        'added',
        'disable',
        'enable',
        'beforeshow',
        'show',
        'beforehide',
        'hide',
        'removed',
        'beforerender',
        'afterrender',
        'beforedestroy',
        'destroy',
        'beforestaterestore',
        'staterestore',
        'beforestatesave',
        'statesave'
    );

		// IDがなければIDを付与
    this.getId();

    Ext.ComponentMgr.register(this);

		// initComponentより前にObservableのコンストラクタが呼び出される
    Ext.Component.superclass.constructor.call(this); // Ext.util.Observable

		// this.baseActionはExt.Actionのインスタンス
    if(this.baseAction){
        this.baseAction.addComponent(this);
    }

		// Componentの初期化（サブクラスでの実装）
    this.initComponent();

		// プラグインの初期化
    if(this.plugins){
        if(Ext.isArray(this.plugins)){
            for(var i = 0, len = this.plugins.length; i < len; i++){
                this.plugins[i] = this.initPlugin(this.plugins[i]);
            }
        }else{
            this.plugins = this.initPlugin(this.plugins);
        }
    }

		// コンポーネントの状態復元
    if(this.stateful !== false){
        this.initState();
    }

		// マークアップへの適用
    if(this.applyTo){
        this.applyToMarkup(this.applyTo);
        delete this.applyTo;
    }else if(this.renderTo){
        this.render(this.renderTo);
        delete this.renderTo;
    }
};

// private
Ext.Component.AUTO_ID = 1000;

Ext.extend(Ext.Component, Ext.util.Observable, {
    disabled : false,
    hidden : false,
    autoEl : 'div',
    disabledClass : 'x-item-disabled',
    allowDomMove : true,
    autoShow : false,
    hideMode : 'display',
    hideParent : false,
    rendered : false,
    tplWriteMode : 'overwrite', // 3.xから tplも
    // private
    ctype : 'Ext.Component',
    // private
    actionMode : 'el',
    // private
    getActionEl : function(){
        return this[this.actionMode];
    },

    initPlugin : function(p){
        if(p.ptype && !Ext.isFunction(p.init)){
            p = Ext.ComponentMgr.createPlugin(p);
        }else if(Ext.isString(p)){
            p = Ext.ComponentMgr.createPlugin({
                ptype: p
            });
        }
        p.init(this);
        return p;
    },

    initComponent : Ext.emptyFn,

    render : function(container, position){
        if(!this.rendered && this.fireEvent('beforerender', this) !== false){
            if(!container && this.el){
                this.el = Ext.get(this.el);
                container = this.el.dom.parentNode;
                this.allowDomMove = false;
            }
            this.container = Ext.get(container);
            if(this.ctCls){
                this.container.addClass(this.ctCls);
            }
            this.rendered = true;
            if(position !== undefined){
                if(Ext.isNumber(position)){
                    position = this.container.dom.childNodes[position];
                }else{
                    position = Ext.getDom(position);
                }
            }

						// 実際の描画処理はここ
            this.onRender(this.container, position || null);

            if(this.autoShow){
                this.el.removeClass(['x-hidden','x-hide-' + this.hideMode]);
            }
            if(this.cls){
                this.el.addClass(this.cls);
                delete this.cls;
            }
            if(this.style){
                this.el.applyStyles(this.style);
                delete this.style;
            }
            if(this.overCls){
                this.el.addClassOnOver(this.overCls);
            }
            this.fireEvent('render', this);


						// Componentの「中身」はrenderイベントの後で描画
            var contentTarget = this.getContentTarget();
            if (this.html){
                contentTarget.update(Ext.DomHelper.markup(this.html));
                delete this.html;
            }
            if (this.contentEl){
                var ce = Ext.getDom(this.contentEl);
                Ext.fly(ce).removeClass(['x-hidden', 'x-hide-display']);
                contentTarget.appendChild(ce);
            }
            if (this.tpl) {
                if (!this.tpl.compile) {
                    this.tpl = new Ext.XTemplate(this.tpl);
                }
                if (this.data) {
                    this.tpl[this.tplWriteMode](contentTarget, this.data);
                    delete this.data;
                }
            }
            this.afterRender(this.container);


            if(this.hidden){
                // call this so we don't fire initial hide events.
                this.doHide();
            }
            if(this.disabled){
                // pass silent so the event doesn't fire the first time.
                this.disable(true);
            }

            if(this.stateful !== false){
                this.initStateEvents();
            }

						// 状態が全て整ってからafterrenderを発生
            this.fireEvent('afterrender', this);
        }
        return this;
    },

    update: function(htmlOrData, loadScripts, cb) {
        var contentTarget = this.getContentTarget();
        if (this.tpl && typeof htmlOrData !== "string") {
            this.tpl[this.tplWriteMode](contentTarget, htmlOrData || {});
        } else {
            var html = Ext.isObject(htmlOrData) ? Ext.DomHelper.markup(htmlOrData) : htmlOrData;
            contentTarget.update(html, loadScripts, cb);
        }
    },


    /**
     * @private
     */
    onAdded : function(container, pos) {
        this.ownerCt = container;
        this.initRef();
        this.fireEvent('added', this, container, pos);
    },

    /**
     * @private
     */
    onRemoved : function() {
        this.removeRef();
        this.fireEvent('removed', this, this.ownerCt);
        delete this.ownerCt;
    },

    /**
     * @private
     */
    initRef : function() {
        if(this.ref && !this.refOwner){
            var levels = this.ref.split('/'),
                last = levels.length,
                i = 0,
                t = this;

            while(t && i < last){
                t = t.ownerCt;
                ++i;
            }
            if(t){
                t[this.refName = levels[--i]] = this;
                this.refOwner = t;
            }
        }
    },

    removeRef : function() {
        if (this.refOwner && this.refName) {
            delete this.refOwner[this.refName];
            delete this.refOwner;
        }
    },

    // private
    initState : function(){
        if(Ext.state.Manager){
            var id = this.getStateId();
            if(id){
                var state = Ext.state.Manager.get(id);
                if(state){
                    if(this.fireEvent('beforestaterestore', this, state) !== false){
                        this.applyState(Ext.apply({}, state));
                        this.fireEvent('staterestore', this, state);
                    }
                }
            }
        }
    },

    // private
    getStateId : function(){
        return this.stateId || ((/^(ext-comp-|ext-gen)/).test(String(this.id)) ? null : this.id);
    },

    // private
    initStateEvents : function(){
        if(this.stateEvents){
            for(var i = 0, e; e = this.stateEvents[i]; i++){
                this.on(e, this.saveState, this, {delay:100});
            }
        }
    },

    // private
    applyState : function(state){
        if(state){
            Ext.apply(this, state);
        }
    },

    // private
    getState : function(){
        return null;
    },

    // private
    saveState : function(){
        if(Ext.state.Manager && this.stateful !== false){
            var id = this.getStateId();
            if(id){
                var state = this.getState();
                if(this.fireEvent('beforestatesave', this, state) !== false){
                    Ext.state.Manager.set(id, state);
                    this.fireEvent('statesave', this, state);
                }
            }
        }
    },

    applyToMarkup : function(el){
        this.allowDomMove = false;
        this.el = Ext.get(el);
        this.render(this.el.dom.parentNode);
    },

    addClass : function(cls){
        if(this.el){
            this.el.addClass(cls);
        }else{
            this.cls = this.cls ? this.cls + ' ' + cls : cls;
        }
        return this;
    },

    removeClass : function(cls){
        if(this.el){
            this.el.removeClass(cls);
        }else if(this.cls){
            this.cls = this.cls.split(' ').remove(cls).join(' ');
        }
        return this;
    },

    // private
    // default function is not really useful

		// 実際の描画処理はここ
    onRender : function(ct, position){
        if(!this.el && this.autoEl){
            if(Ext.isString(this.autoEl)){
                this.el = document.createElement(this.autoEl);
            }else{
                var div = document.createElement('div');
                Ext.DomHelper.overwrite(div, this.autoEl);
                this.el = div.firstChild;
            }
            if (!this.el.id) {
                this.el.id = this.getId();
            }
        }
        if(this.el){
            this.el = Ext.get(this.el);
            if(this.allowDomMove !== false){
                ct.dom.insertBefore(this.el.dom, position);
                if (div) {
                    Ext.removeNode(div);
                    div = null;
                }
            }
        }
    },

    // private
    getAutoCreate : function(){
        var cfg = Ext.isObject(this.autoCreate) ?
                      this.autoCreate : Ext.apply({}, this.defaultAutoCreate);
        if(this.id && !cfg.id){
            cfg.id = this.id;
        }
        return cfg;
    },

    // private
    afterRender : Ext.emptyFn,

    destroy : function(){
        if(!this.isDestroyed){
            if(this.fireEvent('beforedestroy', this) !== false){
                this.destroying = true;
                this.beforeDestroy();
                if(this.ownerCt && this.ownerCt.remove){
                    this.ownerCt.remove(this, false);
                }
                if(this.rendered){
                    this.el.remove();
                    if(this.actionMode == 'container' || this.removeMode == 'container'){
                        this.container.remove();
                    }
                }
                this.onDestroy();
                Ext.ComponentMgr.unregister(this);
                this.fireEvent('destroy', this);
                this.purgeListeners();
                this.destroying = false;
                this.isDestroyed = true;
            }
        }
    },

    deleteMembers : function(){
        var args = arguments;
        for(var i = 0, len = args.length; i < len; ++i){
            delete this[args[i]];
        }
    },

    // private
    beforeDestroy : Ext.emptyFn,

    // private
    onDestroy  : Ext.emptyFn,

    getEl : function(){
        return this.el;
    },

    // private
    getContentTarget : function(){
        return this.el;
    },

    getId : function(){
        return this.id || (this.id = 'ext-comp-' + (++Ext.Component.AUTO_ID));
    },

    getItemId : function(){
        return this.itemId || this.getId();
    },

    focus : function(selectText, delay){
        if(delay){
            this.focus.defer(Ext.isNumber(delay) ? delay : 10, this, [selectText, false]);
            return;
        }
        if(this.rendered){
            this.el.focus();
            if(selectText === true){
                this.el.dom.select();
            }
        }
        return this;
    },

    // private
    blur : function(){
        if(this.rendered){
            this.el.blur();
        }
        return this;
    },

    disable : function(/* private */ silent){
        if(this.rendered){
            this.onDisable();
        }
        this.disabled = true;
        if(silent !== true){
            this.fireEvent('disable', this);
        }
        return this;
    },

    // private
    onDisable : function(){
        this.getActionEl().addClass(this.disabledClass);
        this.el.dom.disabled = true;
    },

    enable : function(){
        if(this.rendered){
            this.onEnable();
        }
        this.disabled = false;
        this.fireEvent('enable', this);
        return this;
    },

    // private
    onEnable : function(){
        this.getActionEl().removeClass(this.disabledClass);
        this.el.dom.disabled = false;
    },

    setDisabled : function(disabled){
        return this[disabled ? 'disable' : 'enable']();
    },

    show : function(){
        if(this.fireEvent('beforeshow', this) !== false){
            this.hidden = false;
						// QuickTips等
            if(this.autoRender){
                this.render(Ext.isBoolean(this.autoRender) ? Ext.getBody() : this.autoRender);
            }
            if(this.rendered){
                this.onShow();
            }
            this.fireEvent('show', this);
        }
        return this;
    },

    // private
    onShow : function(){
        this.getVisibilityEl().removeClass('x-hide-' + this.hideMode);
    },

    hide : function(){
        if(this.fireEvent('beforehide', this) !== false){
            this.doHide();
            this.fireEvent('hide', this);
        }
        return this;
    },

    // private
    doHide: function(){
        this.hidden = true;
        if(this.rendered){
            this.onHide();
        }
    },

    // private
    onHide : function(){
        this.getVisibilityEl().addClass('x-hide-' + this.hideMode);
    },

    // private
    getVisibilityEl : function(){
        return this.hideParent ? this.container : this.getActionEl();
    },

    setVisible : function(visible){
        return this[visible ? 'show' : 'hide']();
    },

    isVisible : function(){
        return this.rendered && this.getVisibilityEl().isVisible();
    },

    cloneConfig : function(overrides){
        overrides = overrides || {};
        var id = overrides.id || Ext.id();
        var cfg = Ext.applyIf(overrides, this.initialConfig);
        cfg.id = id; // prevent dup id
        return new this.constructor(cfg);
    },

    getXType : function(){
        return this.constructor.xtype;
    },

    isXType : function(xtype, shallow){
        //assume a string by default
        if (Ext.isFunction(xtype)){
            xtype = xtype.xtype; //handle being passed the class, e.g. Ext.Component
        }else if (Ext.isObject(xtype)){
            xtype = xtype.constructor.xtype; //handle being passed an instance
        }

        return !shallow ? ('/' + this.getXTypes() + '/').indexOf('/' + xtype + '/') != -1 : this.constructor.xtype == xtype;
    },

    getXTypes : function(){
        var tc = this.constructor;
        if(!tc.xtypes){
            var c = [], sc = this;
            while(sc && sc.constructor.xtype){
                c.unshift(sc.constructor.xtype);
                sc = sc.constructor.superclass;
            }
            tc.xtypeChain = c;
            tc.xtypes = c.join('/');
        }
        return tc.xtypes;
    },

    findParentBy : function(fn) {
        for (var p = this.ownerCt; (p != null) && !fn(p, this); p = p.ownerCt);
        return p || null;
    },

    findParentByType : function(xtype) {
        return Ext.isFunction(xtype) ?
            this.findParentBy(function(p){
                return p.constructor === xtype;
            }) :
            this.findParentBy(function(p){
                return p.constructor.xtype === xtype;
            });
    },

    // protected
    getPositionEl : function(){
        return this.positionEl || this.el;
    },

    // private
    purgeListeners : function(){
        Ext.Component.superclass.purgeListeners.call(this);
        if(this.mons){
            this.on('beforedestroy', this.clearMons, this, {single: true});
        }
    },

    // private
    clearMons : function(){
        Ext.each(this.mons, function(m){
            m.item.un(m.ename, m.fn, m.scope);
        }, this);
        this.mons = [];
    },

    // private
    createMons: function(){
        if(!this.mons){
            this.mons = [];
            this.on('beforedestroy', this.clearMons, this, {single: true});
        }
    },

    mon : function(item, ename, fn, scope, opt){
        this.createMons();
        if(Ext.isObject(ename)){
            var propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/;

            var o = ename;
            for(var e in o){
                if(propRe.test(e)){
                    continue;
                }
                if(Ext.isFunction(o[e])){
                    // shared options
                    this.mons.push({
                        item: item, ename: e, fn: o[e], scope: o.scope
                    });
                    item.on(e, o[e], o.scope, o);
                }else{
                    // individual options
                    this.mons.push({
                        item: item, ename: e, fn: o[e], scope: o.scope
                    });
                    item.on(e, o[e]);
                }
            }
            return;
        }

        this.mons.push({
            item: item, ename: ename, fn: fn, scope: scope
        });
        item.on(ename, fn, scope, opt);
    },

    mun : function(item, ename, fn, scope){
        var found, mon;
        this.createMons();
        for(var i = 0, len = this.mons.length; i < len; ++i){
            mon = this.mons[i];
            if(item === mon.item && ename == mon.ename && fn === mon.fn && scope === mon.scope){
                this.mons.splice(i, 1);
                item.un(ename, fn, scope);
                found = true;
                break;
            }
        }
        return found;
    },

    nextSibling : function(){
        if(this.ownerCt){
            var index = this.ownerCt.items.indexOf(this);
            if(index != -1 && index+1 < this.ownerCt.items.getCount()){
                return this.ownerCt.items.itemAt(index+1);
            }
        }
        return null;
    },

    previousSibling : function(){
        if(this.ownerCt){
            var index = this.ownerCt.items.indexOf(this);
            if(index > 0){
                return this.ownerCt.items.itemAt(index-1);
            }
        }
        return null;
    },

    getBubbleTarget : function(){
        return this.ownerCt;
    }
});

Ext.reg('component', Ext.Component);

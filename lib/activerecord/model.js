(function() {
  var Model,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports.Model = Model = (function() {
    Model.prototype.tableName = "";

    Model.prototype.primaryIndex = 'id';

    Model.prototype.idMiddleware = 'sql';

    Model.prototype.idMiddlewareOptions = {};

    Model.prototype.fields = [];

    Model.prototype.adapters = ["sqlite"];

    Model.prototype._associations = {};

    Model.prototype.hasMany = function() {
      return [];
    };

    Model.prototype.hasOne = function() {
      return [];
    };

    Model.prototype.belongsTo = function() {
      return [];
    };

    Model.prototype.plugins = function() {
      return ['json'];
    };

    Model.find = function() {
      var args, cb, finished,
        _this = this;

      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (arguments.length < 1 || arguments[0] === null) {
        return;
      }
      if (typeof args[args.length - 1] === "function") {
        cb = args.pop();
      } else {
        cb = function() {};
      }
      finished = function(err, results) {
        if (results.length === 0) {
          return cb(err, new _this);
        } else {
          return cb(err, results[0]);
        }
      };
      args.push(finished);
      return this.findAll.apply(this, args);
    };

    Model.findAll = function() {
      var Adapter, adapter, args, cb, finder, model, results,
        _this = this;

      finder = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      model = new this;
      if (typeof args[args.length - 1] === "function") {
        cb = args.pop();
      } else {
        cb = function() {};
      }
      Adapter = require("" + __dirname + "/adapters/" + model.adapters[0]);
      adapter = new Adapter(model.config.get(model.adapters[0]));
      return results = adapter.read(finder, model.tableName(), args, {
        primaryIndex: model.primaryIndex
      }, function(err, rows) {
        var resultSet, row, _i, _len;

        if (err) {
          return cb(err, rows);
        }
        resultSet = [];
        for (_i = 0, _len = rows.length; _i < _len; _i++) {
          row = rows[_i];
          model = new _this(row, false);
          model.notify('afterFind');
          resultSet.push(model);
        }
        return cb(null, resultSet);
      });
    };

    Model.toAssociationName = function(plural) {
      var name;

      if (plural == null) {
        plural = false;
      }
      name = this.name.toLowerCase();
      if (plural) {
        return name + "s";
      } else {
        return name;
      }
    };

    function Model(data, tainted) {
      var association, field, type, _fn, _fn1, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2,
        _this = this;

      if (data == null) {
        data = {};
      }
      if (tainted == null) {
        tainted = true;
      }
      this._data = {};
      this._initData = data;
      this._dirtyData = {};
      this._isDirty = false;
      this._new = true;
      this.pluginCache = [];
      this.extend(this.plugins());
      this.notify('beforeInit');
      _ref = this.fields;
      _fn = function(field) {
        return Object.defineProperty(_this, field, {
          get: function() {
            return this._data[field];
          },
          set: function(val) {
            var filterFunc;

            if (this._data[field] !== val) {
              filterFunc = "filter" + field.charAt(0).toUpperCase() + field.slice(1);
              if ((this[filterFunc] != null) && typeof this[filterFunc] === "function") {
                val = this[filterFunc](val);
              }
              this._data[field] = val;
              this._dirtyData[field] = val;
              return this._isDirty = true;
            }
          },
          enumerable: true,
          configurable: true
        });
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        _fn(field);
        if (this._initData[field]) {
          this._data[field] = this._initData[field];
        } else {
          this._data[field] = null;
        }
      }
      _ref1 = ['hasOne', 'belongsTo', 'hasMany'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        type = _ref1[_j];
        _ref2 = this[type]();
        _fn1 = function(association, type) {
          var assocName;

          assocName = association.toAssociationName(type === 'hasMany');
          return _this[assocName] = function(cb) {
            return this.getAssociation(association, cb);
          };
        };
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          association = _ref2[_k];
          if (Array.isArray(association)) {
            association = association[0];
          }
          _fn1(association, type);
        }
      }
      if (tainted) {
        this._dirtyData = this._initData;
        this._isDirty = true;
      }
      this.notify('afterInit');
    }

    Model.prototype.save = function(cb) {
      var _this = this;

      if (cb == null) {
        cb = function() {};
      }
      if (!this._isDirty) {
        return cb(null);
      }
      return this.notify('beforeSave', function(res) {
        var m, mConfig, mOpts, middleware, postID, preID;

        if (!res) {
          cb(null);
        }
        if (_this.isNew()) {
          _this.notify("beforeCreate");
        } else {
          _this.notify("beforeUpdate");
        }
        if (!_this.isValid()) {
          return cb(true);
        }
        if (_this.isNew() && (_this.idMiddleware != null)) {
          middleware = require("" + __dirname + "/middleware/" + _this.idMiddleware);
          mConfig = _this.config.get('middleware');
          if (mConfig != null ? mConfig[_this.idMiddleware] : void 0) {
            mOpts = mConfig[_this.idMiddleware];
          } else {
            mOpts = {};
          }
          m = new middleware(mOpts);
        }
        preID = function(err, id) {
          var Adapter, adapter, primaryIndex, _i, _len, _ref, _results;

          if (id !== null) {
            _this._data[_this.primaryIndex] = id;
            _this._initData[_this.primaryIndex] = id;
          }
          primaryIndex = _this._initData[_this.primaryIndex];
          _ref = _this.adapters;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            adapter = _ref[_i];
            Adapter = require("" + __dirname + "/adapters/" + adapter);
            adapter = new Adapter(_this.config.get(adapter));
            _results.push(adapter.write(primaryIndex, _this.tableName(), _this._dirtyData, _this.isNew(), {
              primaryIndex: _this.primaryIndex
            }, function(err, results) {
              if (err) {
                return cb(err);
              }
              if (_this.isNew() && (_this.idMiddleware != null) && middleware.supports.afterWrite) {
                return m.afterWrite(_this.idMiddlewareOptions, results, function(err, id) {
                  return postID(err, id, results);
                });
              } else {
                return postID(null, null, results);
              }
            }));
          }
          return _results;
        };
        postID = function(err, id, results) {
          if (id !== null) {
            _this._data[_this.primaryIndex] = id;
          }
          _this._initData[_this.primaryIndex] = _this._data[_this.primaryIndex];
          if (_this.isNew()) {
            _this.notify("afterCreate");
          } else {
            _this.notify("afterUpdate");
          }
          _this._dirtyData = {};
          _this._isDirty = false;
          _this._saved = true;
          _this._new = false;
          return _this.notify("afterSave", function() {
            return cb(null);
          });
        };
        if (_this.isNew() && (_this.idMiddleware != null) && middleware.supports.beforeWrite) {
          return m.beforeWrite(_this.idMiddlewareOptions, preID);
        } else {
          return preID(null, null);
        }
      });
    };

    Model.prototype["delete"] = function(cb) {
      var Adapter, adapter, _i, _len, _ref, _results,
        _this = this;

      if (!this.notify('beforeDelete')) {
        return cb(true);
      }
      _ref = this.adapters;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        adapter = _ref[_i];
        Adapter = require("" + __dirname + "/adapters/" + adapter);
        adapter = new Adapter(this.config.get(adapter));
        _results.push(adapter["delete"](this._data[this.primaryIndex], this.tableName(), {
          primaryIndex: this.primaryIndex
        }, function(err, result) {
          var field, _j, _len1, _ref1;

          if (err) {
            return cb(err);
          }
          _this._data = {};
          _this._dirtyData = {};
          _this._isDirty = false;
          _ref1 = _this.fields;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            field = _ref1[_j];
            _this._data[field] = null;
          }
          _this.notify('afterDelete');
          return cb(null, result);
        }));
      }
      return _results;
    };

    Model.prototype.hasOneExists = function(model) {
      return this.hasAssociation(model, 'hasOne');
    };

    Model.prototype.hasManyExists = function(model) {
      return this.hasAssociation(model, 'hasMany');
    };

    Model.prototype.belongsToExists = function(model) {
      return this.hasAssociation(model, 'belongsTo');
    };

    Model.prototype.hasAssociation = function(model, types) {
      var association, type, _i, _j, _len, _len1, _ref;

      if (types == null) {
        types = ['hasOne', 'hasMany', 'belongsTo'];
      }
      if (!Array.isArray(types)) {
        types = [types];
      }
      for (_i = 0, _len = types.length; _i < _len; _i++) {
        type = types[_i];
        _ref = this[type]();
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          association = _ref[_j];
          if (Array.isArray(association)) {
            if (association[0].name === model.name) {
              return type;
            }
          } else {
            if (association.name === model.name) {
              return type;
            }
          }
        }
      }
      return false;
    };

    Model.prototype.getAssociation = function(model, cb) {
      var config, internalCb, type,
        _this = this;

      type = this.hasAssociation(model);
      if (type === false) {
        return cb(null);
      }
      if (this._associations[model.name] != null) {
        return cb(null, this._associations[model.name]);
      }
      config = this.associationConfig(model);
      internalCb = function(err, value) {
        if (err) {
          return cb(err, value);
        }
        if (type === "hasMany" && !Array.isArray(value)) {
          value = [value];
        }
        _this._associations[model.name] = value;
        return cb(null, value);
      };
      if (typeof this[config.loader] === "function") {
        return this[config.loader](internalCb);
      } else if ((type === "hasOne" || type === "belongsTo") && this.hasField(config.foreignKey)) {
        return model.find(this[config.foreignKey], internalCb);
      } else {
        return internalCb(new model());
      }
    };

    Model.prototype.associationConfig = function(model) {
      var assoc, assocName, config, defaults, key, type, val, _i, _len, _ref;

      type = this.hasAssociation(model);
      _ref = this[type];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        assoc = _ref[_i];
        if (Array.isArray(assoc)) {
          config = assoc[1];
        } else {
          config = {};
        }
      }
      defaults = {};
      assocName = model.toAssociationName(type === 'hasMany');
      assocName = assocName.charAt(0).toUpperCase() + assocName.slice(1);
      defaults.foreignKey = model.name.toLowerCase() + "_id";
      defaults.loader = "load" + assocName;
      defaults.autoFks = true;
      for (key in config) {
        if (!__hasProp.call(config, key)) continue;
        val = config[key];
        defaults[key] = val;
      }
      return defaults;
    };

    Model.prototype.saveBelongsToAssociations = function(cb) {
      var belongsTo, done, doneCount, obj, _i, _len, _ref, _results,
        _this = this;

      if (this.belongsTo().length === 0) {
        cb(true);
      }
      doneCount = 0;
      done = function() {
        doneCount++;
        if (doneCount === _this.belongsTo().length) {
          return cb(true);
        }
      };
      _ref = this.belongsTo();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        belongsTo = _ref[_i];
        if (!this._associations[belongsTo.name]) {
          done();
          continue;
        }
        obj = this._associations[belongsTo.name];
        _results.push(obj.save(function(err) {
          var config;

          config = _this.associationConfig(belongsTo);
          if (_this.hasField(config.foreignKey)) {
            _this._data[config.foreignKey] = obj[obj.primaryIndex];
          }
          return done();
        }));
      }
      return _results;
    };

    Model.prototype.saveHasSomeAssociations = function(cb) {
      var done, doneCount, finishCount, hasMany, hasOne, obj, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results,
        _this = this;

      if (this.hasOne().length === 0 && this.hasMany().length === 0) {
        cb(true);
      }
      finishCount = this.hasOne().length;
      _ref = this.hasMany();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        hasMany = _ref[_i];
        if (this._associations[hasMany.name]) {
          finishCount += this._associations[hasMany.name].length;
        } else {
          finishCount++;
        }
      }
      doneCount = 0;
      done = function() {
        doneCount++;
        if (doneCount === finishCount) {
          return cb(true);
        }
      };
      _ref1 = this.hasOne();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        hasOne = _ref1[_j];
        if (!this._associations[hasOne.name]) {
          done();
          continue;
        }
        obj = this._associations[hasOne.name];
        obj.save(function(err) {
          var config;

          config = _this.associationConfig(hasOne);
          if (_this.hasField(config.foreignKey)) {
            _this._data[config.foreignKey] = obj[obj.primaryIndex];
          }
          return done();
        });
      }
      _ref2 = this.hasMany();
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        hasMany = _ref2[_k];
        if (!this._associations[hasMany.name]) {
          done();
          continue;
        }
        _results.push((function() {
          var _l, _len3, _ref3, _results1,
            _this = this;

          _ref3 = this._associations[hasMany.name];
          _results1 = [];
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            obj = _ref3[_l];
            _results1.push(obj.save(function(err) {
              var config;

              config = _this.associationConfig(hasMany);
              if (_this.hasField(config.foreignKey)) {
                obj[config.foreignKey] = _this[_this.primaryIndex];
              }
              return done();
            }));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Model.prototype.isNew = function() {
      return this._new;
    };

    Model.prototype.isLoaded = function() {
      return !this.isNew();
    };

    Model.prototype.isDirty = function() {
      return this._isDirty;
    };

    Model.prototype.hasField = function(name) {
      return __indexOf.call(this.fields, name) >= 0;
    };

    Model.prototype.tableName = function() {
      if (this.table) {
        return this.table;
      }
      return this.__proto__.constructor.name.toLowerCase() + "s";
    };

    Model.prototype.extend = function(src) {
      var copy, prop, _i, _len, _ref, _results;

      if (!Array.isArray(src)) {
        src = [src];
      }
      _results = [];
      for (_i = 0, _len = src.length; _i < _len; _i++) {
        copy = src[_i];
        if (typeof copy === "string") {
          copy = require(__dirname + ("/plugins/" + copy));
        }
        _ref = copy.prototype;
        for (prop in _ref) {
          if (!__hasProp.call(_ref, prop)) continue;
          if (prop === "constructor") {
            continue;
          }
          if (!this[prop]) {
            this[prop] = copy.prototype[prop];
          }
        }
        _results.push(this.pluginCache.push(new copy(this)));
      }
      return _results;
    };

    Model.prototype.notify = function(event, cb) {
      var plugin, result, _i, _len, _ref, _results,
        _this = this;

      if (cb == null) {
        cb = null;
      }
      if (cb) {
        return this[event](function(result1) {
          return _this["_" + event](function(result2) {
            var plugin, result, _i, _len, _ref;

            result = result1 && result2;
            _ref = _this.pluginCache;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              plugin = _ref[_i];
              result = result && plugin[event]();
            }
            return cb(result);
          });
        });
      } else {
        result = this[event]() && this["_" + event]();
        _ref = this.pluginCache;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          plugin = _ref[_i];
          _results.push(result = result && plugin[event]());
        }
        return _results;
      }
    };

    Model.prototype._isValid = function() {
      return true;
    };

    Model.prototype._beforeInit = function() {
      return true;
    };

    Model.prototype._afterInit = function() {
      return true;
    };

    Model.prototype._afterFind = function() {
      this._new = false;
      return true;
    };

    Model.prototype._beforeSave = function(c) {
      return this.saveBelongsToAssociations(c);
    };

    Model.prototype._beforeCreate = function() {
      return true;
    };

    Model.prototype._beforeUpdate = function() {
      return true;
    };

    Model.prototype._afterCreate = function() {
      return true;
    };

    Model.prototype._afterUpdate = function() {
      return true;
    };

    Model.prototype._afterSave = function(c) {
      return this.saveHasSomeAssociations(c);
    };

    Model.prototype._beforeDelete = function() {
      return true;
    };

    Model.prototype._afterDelete = function() {
      return true;
    };

    Model.prototype.isValid = function() {
      return true;
    };

    Model.prototype.beforeInit = function() {
      return true;
    };

    Model.prototype.afterInit = function() {
      return true;
    };

    Model.prototype.afterFind = function() {
      return true;
    };

    Model.prototype.beforeSave = function(c) {
      return c(true);
    };

    Model.prototype.beforeCreate = function() {
      return true;
    };

    Model.prototype.beforeUpdate = function() {
      return true;
    };

    Model.prototype.afterCreate = function() {
      return true;
    };

    Model.prototype.afterUpdate = function() {
      return true;
    };

    Model.prototype.afterSave = function(c) {
      return c(true);
    };

    Model.prototype.beforeDelete = function() {
      return true;
    };

    Model.prototype.afterDelete = function() {
      return true;
    };

    return Model;

  })();

}).call(this);

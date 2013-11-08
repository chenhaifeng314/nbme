DS.NodeRESTStore = DS.Store.extend({
    findMany: function(type, idsOrReferencesOrOpaque, record, relationship) {
        var ret;
        
        // check for hasMany relationship
        if (typeof relationship === 'object' && relationship.kind === 'hasMany') {
            record.set('findManyKey', relationship.key);
            record.set('findManyType', relationship.parentType);
        }
        
        ret = this._super(type, idsOrReferencesOrOpaque, record, relationship);
        
        // clear the variables we set to be clean
        record.set('findManyKey', null);
        record.set('findManyType', null);
        
        return ret;
    }
});

DS.NodeRESTSerializer = DS.RESTSerializer.extend({
    init: function() {
        this._super();

        this.configure({
            pagination: 'pagination',
        });
    },

    patchInJSONRoot: function(json, type, many) {
        var pJSON, root, res,
            meta = this.configOption(type, 'meta');

        pJSON = {};
        root = this.rootForType(type);

        if (many === true) {
            root = this.pluralize(root);
        }

        if (json['results'] && json['results'].constructor.name === 'Array') {
            pJSON[root] = json['results'];

            // this is a paginated result, compute pagination properties
            var page_match = new RegExp('page=([0-9]+)');
            var items = {
                total: json['count'],
                first: 1,
                last: json['results'].length,
                per_page: undefined,
            };
            var page = {
                total: 1,
                current: 1,
                previous: false,
                next: false,
            };

            // do we have a previous page?
            if(res = page_match.exec(json['previous'])) {
                page.previous = parseInt(res[1], 10);
                page.current = page.previous + 1;

                // the number of items per page is calculated from number of
                // items in previous pages and the number of the previous page
                items.per_page = (json['count'] - json['results'].length) / page.previous;
            }

            // do we have a next page?
            if(res = page_match.exec(json['next'])) {
                page.next = parseInt(res[1], 10);
                page.current = page.next - 1;

                // as we have a next page, we know that the current page is
                // full, so just count how many items are in the current page
                items.per_page = json['results'].length;
            }

            if(items.per_page === undefined) {
                // `items.per_page` is not set, this happen when there is only
                // one page. And with only one page, we are not able to guess
                // the server-side configured value for the number of items per
                // page.
            } else {
                page.total = Math.ceil(json['count'] / items.per_page);
                items.first = (page.current - 1) * items.per_page + 1;
                items.last = items.first + json['results'].length - 1;
            }

            // add a pagination object in metadata
            pJSON[meta] = {
                pagination: {
                    page: page,
                    items: items,
                },
            };
        } else {
            pJSON[root] = json;
        }

        return pJSON;
    },

    keyForHasMany: function(type, name) {
        return this.keyForAttributeName(type, name);
    },

    keyForBelongsTo: function(type, name) {
        return this.keyForAttributeName(type, name);
    },

    extract: function(loader, json, type, records) {
        json = this.patchInJSONRoot(json, type, false);
        this._super(loader, json, type, records);
    },

    extractMany: function(loader, json, type, records) {
        json = this.patchInJSONRoot(json, type, true);
        this._super(loader, json, type, records);
    },

    // modified version of https://github.com/emberjs/data/blob/master/packages/ember-data/lib/serializers/json_serializer.js#L169
    // Django Rest Framework expects a non-embedded has-many to serialize to an
    // array of ids, but the JSONSeriarlizer assumed non-embedded relationship 
    // updates would happen in the related model. 
    addHasMany: function(hash, record, key, relationship) {
      var type = record.constructor,
        name = relationship.key,
        serializedHasMany = [],
        includeType = (relationship.options && relationship.options.polymorphic),
        manyArray, embeddedType;

      // Get the DS.ManyArray for the relationship off the record
      // manyArray = get(record, name);
      manyArray = record.get(name);

      // If the has-many is not embedded, send just the array of ids.
      embeddedType = this.embeddedType(type, name);
      if (embeddedType !== 'always') {
        // Build up the array of ids
        manyArray.forEach(function (record) {
          serializedHasMany.push(this.serializeId(record.id));
        }, this);
      } else {
        // Build up the array of serialized records
        manyArray.forEach(function (record) {
          serializedHasMany.push(this.serialize(record, { includeId: true, includeType: includeType }));
        }, this);
      }

      // Set the appropriate property of the serialized JSON to the
      // array of serialized embedded records or array of ids
      hash[key] = serializedHasMany;
    }
});

function rejectionHandler(reason) {
    Ember.Logger.error(reason, reason.message);
    throw reason;
}

DS.NodeRESTAdapter = DS.RESTAdapter.extend({
    bulkCommit: false,
    serializer: DS.NodeRESTSerializer,

    createRecord: function(store, type, record) {
        var root, adapter, data;

        root = this.rootForType(type);
        adapter = this;
        data = this.serialize(record);

        return this.ajax(this.buildURL(root), "POST", {
            data: data
        }).then(function(json) {
            adapter.didCreateRecord(store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        }).then(null, rejectionHandler);
    },

    updateRecord: function(store, type, record) {
        var id, root, adapter, data;

        id = Ember.get(record, 'id');
        root = this.rootForType(type);
        adapter = this;
        data = this.serialize(record);

        return this.ajax(this.buildURL(root, id), "PUT", {
            data: data
        }).then(function(json) {
            adapter.didUpdateRecord(store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        }).then(null, rejectionHandler);
    },

    findMany: function(store, type, ids, parent) {
        var adapter, root, url;
        adapter = this;

        if (parent) {
            url = this.buildFindManyUrlWithParent(type, parent);
        } else {
            root = this.rootForType(type);
            url = this.buildURL(root);
        }

        return this.ajax(url, "GET", {
        }).then(function(json) {
          adapter.didFindMany(store, type, json);
        }).then(null, rejectionHandler);
    },

    ajax: function(url, type, hash) {
      hash = hash || {};
      hash.cache = false;

      return this._super(url, type, hash);
    },

    buildURL: function(record, suffix) {
        var url = this._super(record, suffix);

        if (url.charAt(url.length -1) !== '/') {
            url += '/';
        }

        return url;
    },

    buildFindManyUrlWithParent: function(type, parent) {
        var root, url, endpoint, parentType, parentValue;

        endpoint = parent.get('findManyKey');
        parentType = parent.get('findManyType');

        if (typeof endpoint !== 'string') {
            parent.eachRelationship(function(name, relationship) {
                if (relationship.kind === 'hasMany' && relationship.type === type) {
                    endpoint = relationship.key;
                    parentType = relationship.parentType;
                }
            });
        }
        
        Ember.assert("could not find a relationship for the specified child type", typeof endpoint !== "undefined");

        endpoint = this.serializer.keyForAttributeName(parentType, endpoint);
        parentValue = parent.get('id');
        root = this.rootForType(parentType);
        url = this.buildURL(root, parentValue);

        return url + endpoint + '/';
    },

    /**
      RESTAdapter expects HTTP 422 for invalid records and a JSON response
      with errors inside JSON root `errors`, however DRF uses 400
      and errors without a JSON root.
    */
    didError: function(store, type, record, xhr) {
        if (xhr.status === 400) {
            var data = JSON.parse(xhr.responseText);
            var errors = {};

            // Convert error key names
            record.eachAttribute(function(name) {
                var attr = this.serializer.keyForAttributeName(type, name);
                if (attr in data) {
                    errors[name] = data[attr];
                }
            }, this);

            record.eachRelationship(function(name, relationship) {
                var attr;
                if (relationship.kind === 'belongsTo') {
                    attr = this.serializer.keyForBelongsTo(type, name);
                } else {
                    attr = this.serializer.keyForHasMany(type, name);
                }
                if (attr in data) {
                    errors[name] = data[attr];
                }
            }, this);

            store.recordWasInvalid(record, errors);
        } else {
            this._super(store, type, record, xhr);
        }
    }
});

App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

App.Adapter = DS.RESTAdapter.extend({
    serializer: DS.RESTSerializer.extend({
        primaryKey: function() {
            return '_id';
        }
    })
});

App.Store = DS.Store.extend({
    revision: 12,
    adapter: 'App.Adapter'
});

App.Router.map(function() {
    this.route('index', { path: '/' });
    this.route('about', {path: '/about'});

    this.resource('locations', function() {
        this.route('new', {path: '/new'});
        this.route('edit', {path: '/:location_id'});
    });
});
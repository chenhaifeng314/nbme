NBME.User = DS.Model.extend({
    username: DS.attr('string'),
    hashpwd: DS.attr('string'),
    sex: DS.attr('string'),
    email: DS.attr('string'),
    phone: DS.attr('string'),
    about: DS.belongsTo('about'),
    addresses: DS.hasMany('address')
});

NBME.Address = DS.Model.extend({
    city: DS.attr('string'),
    street: DS.attr('string')
});

NBME.About = DS.Model.extend({
    desc: DS.attr('string'),
    card: DS.attr('string')
});

NBME.UserSerializer = Ember.FullSerializer;
NBME.UserAdapter = Ember.FullAdapter;

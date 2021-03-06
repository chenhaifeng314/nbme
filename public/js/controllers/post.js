NBME.PostIndexController = Ember.ArrayController.extend({
    actions: {
        removeItem: function(post) {
            post.removeComments();
            post.deleteRecord();
            post.save();
        }
    }
});

NBME.PostEditController = Ember.ObjectController.extend({
    actions: {
        updateItem: function(post) {
            post.save();
            this.get('target').transitionTo('post');
        }
    }
});

NBME.PostViewController = Ember.ObjectController.extend({
    actions: {
        removeComment: function(post, comment) {
            post.get('comments').removeObject(comment);
            post.save().then(function() {
                comment.deleteRecord();
                comment.save();
            });
        },
        comment: function(post) {
            var comment = this.store.createRecord('comment', {
                body: post.get('newComment')
            });
            post.set('newComment', '');
            comment.save().then(function(c) {
                post.get('comments').pushObject(c);
                post.save();
            });
        }
    }
});

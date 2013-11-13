window.hbs = [{"name":"about","value":"<p>This is the about page. </p> "},{"name":"index","value":"<p>This is the homepage....</p> "},{"name":"location/edit","value":"{{#if controller.isNew}} <h1>New location</h1> {{else}} <h1>Edit location</h1> {{/if}} {{partial \"location/location_form\"}} <p> <button {{action updateItem this}}> {{#if controller.isNew}} Create location {{else}} Update location {{/if}} </button> </p> "},{"name":"location/index","value":"<span>{{#linkTo \"location.new\"}} <img src=\"img/add-icon.png\" />New location{{/linkTo}}</span> {{#if itemsSelected}} <span style=\"float:right\"> <button {{action 'removeSelectedLocations'}}>Remove {{editCounter}} selected locations</button> </span> {{/if}} {{#if locationsPresent}} <table class=\"table table-hover\"> <tr> <th>Selected</th> <th>Latitude</th> <th>Longitude</th> <th>Accuracy</th> <th></th> <th></th> </tr> {{#each location in controller itemController=\"locationEdit\"}} <tr {{bindAttr class=\"selected:warning\" }}> <td>{{view Ember.Checkbox checkedBinding=\"selected\"}}</td> <td>{{location.latitude}}</td> <td>{{location.longitude}}</td> <td>{{location.accuracy}}</td> <td>{{#linkTo \"location.edit\" location}} <img src=\"img/edit-icon.png\" />{{/linkTo}}</td> <td> <a href=\"#\" {{action removeItem location}}> <img src=\"img/delete-icon.png\" border=\"0\" /> </a> </td> </tr> {{/each}} </table> <span>Nr of locations = {{content.length}}</span> {{else}} <div>No locations present.</div> {{/if}} "},{"name":"location/_location_form","value":"<form class=\"form-horizontal\"> <div class=\"control-group\"> <label class=\"control-label\" for=\"latitude\">Latitude</label> <div class=\"controls\"> {{view Ember.TextField valueBinding=\"latitude\"}} </div> </div> <div class=\"control-group\"> <label class=\"control-label\" for=\"latitude\">Longitude</label> <div class=\"controls\"> {{view Ember.TextField valueBinding=\"longitude\"}} </div> </div> <div class=\"control-group\"> <label class=\"control-label\" for=\"accuracy\">Accuracy</label> <div class=\"controls\"> {{view Ember.TextField valueBinding=\"accuracy\"}} </div> </div> </form> "}]
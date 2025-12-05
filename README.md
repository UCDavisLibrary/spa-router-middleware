# spa-router-middleware
Handles static routes for SPAs in Express

Problem.  In your spa, you update your path using history state api.  So instead of routes like /#foo /#bar you have routes list /foo and /bar.  But your apps resources are served from /, so on refresh of /foo a 404 is returned.  This middleware handles the routing by allowing you to set the routes your app uses.

This middleware then allows for a small mustache template to insert 1) known routes by the server and 2) any additional json info you would like to insert on load (ie, user info if the user is logged in, etc).

example:

Node Helper Module static.js
```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const spaMiddleware = require('@ucd-lib/spa-router-middleware');
const config = require('../config');

module.exports = (app) => {
  // path to your spa assets dir
  let assetsDir = path.join(__dirname, '..', 'public');

  /**
   * Setup SPA app routes
   */
  spaMiddleware({
    // pass the express app
    app, 
    
    // pass the file you want to use
    htmlFile : path.join(assetsDir, 'index.html'), 
    
    // are we serving from host root (/)?
    isRoot : true, 
    
    // array of root paths.  ie appRoutes = ['foo', 'bar'] to server /foo/* /bar/*
    // or use allRoutes: true, to serve on all routes except your static assets
    appRoutes : config.appRoutes, 
    
    // options for express.static(dir, opts)
    static : {
      dir : assetsDir
      // opts : {}  // additional opts for express.static
    },

    // do you want to manually handle 404 for requests to unknown resources
    // this lets you render your own 404 page using the index.html
    enable404 : false,

    getConfig : async (req, res, next) => {
      let user;
      if( req.session.user ) {
        user = {
          loggedIn : true,
          username : req.session.user
        };
      } else {
        user = {loggedIn: false};
      }

      next({
        user : user,
        appRoutes : config.appRoutes
      });
    },
    
    template : (req, res, next) => {
      next({title: 'spa test'});
    }
  });

}
```

express index.js
```javascript
const express = require('express');
const app = express();

// setup static routes
require('./static')(app);

app.listen(3000, () => {
  console.log('server ready on port 3000');
});
```


index.html
```html
<!doctype html>
<html>
  <head>
    <!-- template variable -->
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=no">

    <!-- 
        spa-router-middleware will replace this with
        <script>var APP_CONFIG = {"user":{"loggedIn":false},"appRoutes":["foo","bar"]};</script>
     -->
    {{config}}
  </head>

  <body>
    <!-- stuff -->
  </body>
</html>
```
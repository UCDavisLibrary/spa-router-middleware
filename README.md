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
    app: app, // pass the express app
    htmlFile : path.join(assetsDir, 'index.html'), // pass the file you want to use
    isRoot : true, // are we serving from host root (/)?
    appRoutes : config.appRoutes, // array of root paths.  ie appRoutes = ['foo', 'bar'] to server /foo/* /bar/*
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

  /**
   * Setup static asset dir
   */
  app.use(express.static(assetsDir));
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
const path = require('path');
const fs = require('fs');
const express = require('express');

/**
 * @function middleware
 * @description setup SPA routes to SPA .html file(s)
 * 
 * Route names will be wrapped with /[route]* so 'search' will become '/search*'.  If you want the base 
 * path to be included without regex, use the 'isRoot' flag.
 * 
 * @param {Object} config middleware config object
 * @param {Array} config.appRoutes base routes to be handled by SPA
 * @param {Object} config.app express server instance
 * @param {String} config.htmlFile full path to html file to serve
 * @param {Boolean} config.isRoot should the root path serve the SPA?
 * @param {Object} config.static have the middleware register express static?  This is required for 404 pages
 * @param {Object} config.static.dir dir to serve for static assets
 * @param {Object} config.static.opts additional options for express.static()
 * @param {Boolean} config.enable404 serve the SPA as the 404 page, requires stati
 * @param {Function} config.getConfig append additional config via mustache {{config}} in html file
 */
function middleware(config) {
  if( !config.appRoutes ) config.appRoutes = [];

  if( config.isRoot ) {
    config.app.use(/^\/$/, (req, res) => handleRequest(req, res, config));
  }

  let filename = path.parse(config.htmlFile).base;
  config.app.use(`/${filename}`, (req, res) => handleRequest(req, res, config));

  config.appRoutes.forEach(route => {
    config.app.use(`/${route}*`, (req, res) => handleRequest(req, res, config));
  });

  if( config.static ) {
    let opts = config.static.opts || {};
    if( config.enable404 ) {
      opts.fallthrough = true;
    }
    config.app.use(express.static(config.static.dir, opts));
  }

  if( config.enable404 ) {
    config.app.use((req, res) => {
      res.status(404);
      handleRequest(req, res, config)
    });
  }
}

function handleRequest(req, res, config) {
  let html = fs.readFileSync(config.htmlFile, 'utf-8');
  handleConfig(req, res, html, config);
}

function handleConfig(req, res, html, config) {
  if( config.getConfig ) {
    config.getConfig(req, res, (data) => {
      html = html.replace(/{{config}}/, `<script>var APP_CONFIG = ${JSON.stringify(data)};</script>`);
      handleTemplate(req, res, html, config);
    });
  } else {
    handleTemplate(req, res, html, config);
  }
}

function handleTemplate(req, res, html, config) {
  if( config.template ) {
    config.template(req, res, (varMap) => {
      for( var key in varMap ) {
        html = html.replace(new RegExp(`{{${key}}}`,'g'), varMap[key]);
      }
      send(res, html);
    });
  } else {
    send(res, html);
  }
}

function send(res, html) {
  res.set('Content-Type', 'text/html');
  res.send(html);
}

module.exports = middleware;
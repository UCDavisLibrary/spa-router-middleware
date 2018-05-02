const path = require('path');
const fs = require('fs');
let mconfig = null;

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
 * @param {Function} config.getConfig append additional config via mustache {{config}} in html file
 */
async function middleware(config) {
  mconfig = config;
  if( !config.appRoutes ) config.appRoutes = [];

  if( config.isRoot ) {
    let filename = path.parse(config.htmlFile).base;
    config.app.use(/^\/$/, handleRequest);
    config.app.use(`/${filename}`, handleRequest);
  }

  config.appRoutes.forEach(route => {
    config.app.use(`/${route}*`, handleRequest);
  });
}

async function handleRequest(req, res) {
  res.set('Content-Type', 'text/html');

  let html = fs.readFileSync(mconfig.htmlFile, 'utf-8');

  if( mconfig.getConfig ) {
    let data = await mconfig.getConfig(req, res);
    html = html.replace(/{{config}}/, `<script>var APP_CONFIG = ${JSON.stringify(data)};</script>`);
  } else {
    html = html.replace(/{{config}}/, '');
  }

  if( mconfig.template ) {
    let varMap = await mconfig.template(req, res);
    for( var key in varMap ) {
      html = html.replace(new RegExp(`{{${key}}}`,'g'), varMap[key]);
    }
  }

  res.send(html);
}

module.exports = middleware;
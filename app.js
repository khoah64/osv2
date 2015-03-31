/**
 * Module dependencies.
 */

//require('log-analysis');

var express = require('express');
var http = require('http');
var path = require('path');
var security = require('./routes/security');
var storageAPI = require('./routes/storage');
var manager = require('./routes/manager');

var app = express();

// all environments
var port = (process.env.VCAP_APP_PORT || 2000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

app.use(function(req, res, next){
	//console.log("Headers:", req.headers);
	console.log(req.method, ' ', req.path);
	next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use(express.favicon());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.limit('100mb'));
app.use(express.methodOverride());
app.use(express.cookieParser('swiftopenstack'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//Error handling
app.use(function(err, req, res, next){
	console.log(err.stack);
	res.send(500, err.message);
});

// Our security routes
app.get('/', security.welcome);

app.post('/login', security.login);
app.get('/logout', security.logout);

// Get list of all containers
app.get('/container', manager.getContainers);

// Get particular container
app.get('/container/:name', manager.getContainer);

// Create new container
app.post('/container', manager.createContainer);

// Delete a container.  
// TODO: Do not use get method to delete a container.
app.get('/container/:name/delete', manager.deleteContainer);

// Get objects in container
app.get('/container/:name/object', manager.getObjects);

//Delete object from container
//TODO: Do not use get method to delete an object.
app.get('/container/*/object/*/delete', manager.deleteObject);

// Download particular object from container
app.get('/container/*/object/*/download', manager.downloadObject);

// Upload new object to container
app.post('/container/:name/object', manager.uploadObject);

// Fire up the web server
http.createServer(app).listen(port, host, function(){
	console.log('Running on host ' + host + ' using port ' + port);
});

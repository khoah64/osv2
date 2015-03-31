var security = require('./security');
var storageAPI = require('./storage');
var fs = require('fs');

exports.getContainers = function (req, res) {	
	var callback = function(containers) {
		storageAPI.getContainers(function(err, containers) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error getting containers"});
			}
			var project = storageAPI.cloud_creds.CloudIntegration.project;
			res.render('account', {msg: "Project: " + project, 
				containers: containers,
				config: {username: storageAPI.cloud_creds.CloudIntegration.credentials.userid},
				title: "Openstack Swift Object Storage Client"});
		});
	}.call(this);
};

exports.getContainer = function (req, res) {
	var callback = function(container) {
		storageAPI.getContainer(req.params.name, function(err, container) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error getting container"});
			}
			res.render('container', {msg: "", 
				container: container,
				config: {username: storageAPI.cloud_creds.CloudIntegration.credentials.userid},
				title: "Openstack Swift Object Storage Client"});
		});
	}.call(this);
};

exports.createContainer = function (req, res) {
	var callback = function(container) {
		storageAPI.createContainer(req.body.container_name, function(err, container) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error creating container"});
			}
			res.redirect('/container');
		});
	}.call(this);
};

exports.deleteContainer = function (req, res) {
	var callback = function(container) {
		storageAPI.destroyContainer(req.params.name, function(err, container) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error deleting container"});
			}
			res.redirect('/container');
		});
	};
	callback.call(this);
};

exports.getObjects = function (req, res) {
	var callback = function(container, objects) {

		storageAPI.getObjects(req.params.name, function(err, container, objects) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error getting container"});
			}
			res.render('container', {msg: "got objects", 
				container: container,
				objects: objects,
				config: {username: storageAPI.cloud_creds.CloudIntegration.credentials.userid},
				title: "Openstack Swift Object Storage Client"});
		});
	};
	callback.call(this);
};

exports.deleteObject = function (req, res) {
	var callback = function(file) {
		var container = req.params[0];
		var _file = req.params[1];
		
		storageAPI.removeFile(container, _file, function(err, file) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error removing file"});
			}
			res.redirect('/container/' + container + '/object');
		});
	}.call(this);
};

exports.downloadObject = function (req, res) {
	var callback = function(file) {
		var options = {
				container: req.params[0],
				remote: req.params[1]
		};
		storageAPI.download(options, function(err, file) {
			if (err) {
				console.dir(err);
				res.render('container', {msg: "Error downloading file"});
			}
			res.download(req.params[1], req.params[1], function(err) {
				if (err) {
					throw err;
				}
				// Delete the file in the original directory
				fs.unlink(req.params[1], function(err){
					if (err) {
						throw err;
					}
				});
			});
		});
	}.call(this);
};

exports.uploadObject = function (req, res) {
	var callback = function(file) {
		// Move the temporary file to a real path
		var temp_path = req.files.object_name.path;
		var real_path = req.files.object_name.name;
		fs.rename(temp_path, real_path, function(err){
			if (err) {
				throw err;
			}
		});
		var options = {
				container: req.params.name,
				remote: real_path,
				contentType: 'application/json',
				size: 1234
		};
		storageAPI.upload(options, function(err, file) {
			if (err) {
				// Delete the file you put in the app directory
				fs.unlink(real_path, function(err){
					if (err) {
						throw err;
					}
				});
				console.dir(err);
				res.render('container', {msg: "Error getting container"});
			}
		});
		console.log(options);
		// Delete the file you put in the app directory
		fs.unlink(real_path, function(err){
			if (err) {
				throw err;
			}
		});
		res.redirect('/container/' + req.params.name + '/object');
	}.call(this);
};

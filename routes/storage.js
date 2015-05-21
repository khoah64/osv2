var pkgcloud = require("pkgcloud");
var _ = require("underscore");
var fs = require('fs');
var async = require('async');

exports.cloud_creds = null;
var client = null;
var localhost = process.env.VCAP_APP_HOST ? false : true;

exports.storageInit = function(cloud_creds) {
	console.log('storageInit entry');
	console.log('cloud_creds: ', cloud_creds);
	exports.cloud_creds = JSON.parse(cloud_creds);
	console.log('this.cloud_creds: ', cloud_creds);
	console.log('storageInit exit');
};
	
exports.createClient = function(callback) {
	console.log('storageAPI.createClient entry');
  
	if (!client) {

        if (localhost) {
            console.log('running on localhost.. using hardcoded credentials in createclient');


            exports.cloud_creds = {};
            exports.cloud_creds.CloudIntegration = {};
            exports.cloud_creds.CloudIntegration.credentials = {};

            // LOCALHOST: UPDATE THESE CREDENTIALS WITH YOURS !!!!
            exports.cloud_creds.CloudIntegration.credentials.userid = 'petersca@us.ibm.com';
            exports.cloud_creds.CloudIntegration.credentials.password = 'hQQa8R5LRa.GnQs{';
            exports.cloud_creds.CloudIntegration.project = '71268c4b-c023-47b1-a17c-36dbac6d7818';
            exports.cloud_creds.CloudIntegration.region = 'dal09';
            exports.cloud_creds.CloudIntegration.sdk_auth_url = 'https://qint-keystone.open-test.ibmcloud.com';
            // END LOCALHOST
        }

		console.log('storageAPI calling pkgcloud');
		async.series([function(callback) {
			console.log("createclient:", exports.cloud_creds);
			console.log('userid:' +  exports.cloud_creds.CloudIntegration.credentials.userid);

			client = require('pkgcloud').storage.createClient({
				provider: 'openstack',
				username:  exports.cloud_creds.CloudIntegration.credentials.userid,
				password:  exports.cloud_creds.CloudIntegration.credentials.password,
				tenantName:  exports.cloud_creds.CloudIntegration.project,
				region:  exports.cloud_creds.CloudIntegration.region,
				authUrl:  exports.cloud_creds.CloudIntegration.sdk_auth_url,
				useServiceCatalog: true
			});

			client.auth(function(err) {
				if (err) {
					console.error(err);
					callback(err);
				} else {
					// safe to assume the same client object now has the identity info
					console.log(client._identity);
					//console.log(pkgcloud_client._identity.serviceCatalog.services);
					//console.log('got client');
					callback();
				}
			});
		} ], function() {
			console.log('storageAPI.createClient exit');
			callback();
		});
	}
	else {
		callback();
	}
};


// class methods
exports.getContainers = function(callback) {
	client.getContainers(function (err, containers) {
		if (err) {
			console.error(err);
			callback(err, null);
		}
		callback(null, containers);
	});
};

exports.getContainer = function(container_name, callback) {
	console.log('getContainer: entry');
	client.getContainer(container_name, function (err, container) {
		if (err) {
			console.error(err);
			callback(err, null);
		}
		callback(null, container);
	});
};

exports.createContainer = function(container_name, callback) {
	var data = {
		  name: container_name,
		  metadata: {}
	};
	client.createContainer(data, function (err, container) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}
		callback(null, container);
	});
};

exports.destroyContainer = function(container_name, callback) {
	client.getContainer(container_name, function (err, container) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}
		client.destroyContainer(container, function (err, result) {
			if (err) {
				console.dir(err);
				callback(err, null);
			}
			callback(null, result);
		});
	});

};

exports.getObjects = function(container_name, callback) {
	client.getContainer(container_name, function (err, container) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}

		client.getFiles(container, function (err, objects) {
			if (err) {
				console.dir(err);
				callback(err, null);
			}
			callback(null, container, objects);
		});
	});
};

exports.getObject = function(container, object, callback) {
	client.getFile(function (err, object) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}
		callback(null, object);
	});
};

exports.upload = function(options, callback) {
	var directory = options.remote;
	var readStream = fs.createReadStream(directory);
	var writeStream =  client.upload(options); 
	writeStream.on('error', function(err){
		if (err) {
			console.dir(err);
			callback(err, null);
		}
	});
	writeStream.on('success', function(file){
		callback(null, file);
	});
	readStream.pipe(writeStream);
};

exports.download = function(options, callback) {
	var filename = options.remote;
	var readStream = fs.createWriteStream(filename);
	client.download(options, function (err, file) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}
		callback(null, file);
	}).pipe(readStream);
};

exports.removeFile = function(container, file, callback) {
	client.removeFile(container, file, function (err, result) {
		if (err) {
			console.dir(err);
			callback(err, null);
		}
		callback(null, result);
	});
};

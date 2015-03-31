var needle = require('needle');
var storageAPI = require('./storage');
var pkgcloud = require("pkgcloud");
var _ = require('underscore');
var request = require('request');
var async = require('async');

var config = {};
var vcap_creds = null;
var vcap_secret = null;
//exports.cloud_creds = null;
var api = null;

/********************************************************************************************
 * Get the binding credentials from the VCAP services environment variable
 ********************************************************************************************/
var getVCAPServices = function() {

	if (vcap_creds) 
	{
		return vcap_creds;
	}

	if (process.env.VCAP_SERVICES) {
		console.log("VCAP: ", process.env.VCAP_SERVICES);
		var sosl_name = "Object Storage";
		var sosl_obj = JSON.parse(process.env.VCAP_SERVICES);

		var sosl = sosl_obj[sosl_name];
		if (sosl) 
		{
			var credentials =  sosl[0].credentials;
			vcap_creds = {
					"auth_url": credentials.auth_url,
					"username": credentials.username,
					"password": credentials.password
	
			};
			vcap_secret = "Basic " + new Buffer(credentials.username + ":" + credentials.password).toString("base64");
		}
	}
};

/********************************************************************************************
 * Get the Cloud Credentials using VCAP binding information.
 ********************************************************************************************/
var getCloudCredentials = function(callback) {
	
	var res_handler = function(error, res, body) {	
		if (error) {
			console.error(error);
			callback(error, null);
		}
		else if (res.statusCode == 200) 
		{   
			callback(null, body);
		}
		else 
		{
			console.error("statusCode is ", res.statusCode);
			console.error("error message is ", body);
			callback(body + " , statusCode: " + res.statusCode);
		}
	};
	
	// Get vcap service binding information
	if (!vcap_creds) {
		getVCAPServices();
		if (!vcap_creds) {
			callback("getVCAPServices failed", null);
		}
	}

	var req_options = {
		url: vcap_creds.auth_url,
		headers: {'accept': 'application/json',
			'Authorization': vcap_secret},
		timeout: 20000,
		method: 'GET'
	};

	request(req_options, res_handler);
};



/********************************************************************************************
 * Application specific function below
 ********************************************************************************************/
var getContainers = function(req, res) {
	console.log('GETCONTAINER: entry');

	storageAPI.getContainers(function(err, containers) {
		if (err) {
			console.error(err);
			res.render('welcome', {msg: 'Error getting containers'});
		}
		else {
			res.redirect('/container');
		}
	});
};

exports.welcome = function(req, res) {
	console.log("called welcome");
	getCloudCredentials(function(err, cloud_creds) {
		if (err) {
			res.render('welcome', {msg: 'Error getting cloud credentials'});
		}
		else {
			storageAPI.storageInit(cloud_creds);
			async.series([function(callback) {
				console.log('got api calling createclient');
				storageAPI.createClient(function() {
					callback();
				});
			} ], function() {
				getContainers(req, res);
			});
		}
	});
};

exports.logout = function(req, res) {
	vcap_creds = null;
	res.render('welcome', {msg: ''});
};

exports.login = function(req, res) {	
	config = { 
			username: req.body.userid, 
			password: req.body.password,
			tenantName: req.body.project,
			region: req.body.region,
			authUrl: req.body.auth
	};
	
	if (!config.authUrl) {
		res.render('welcome', {msg: 'Authorization URL is required'});
	}
	else {
		getContainers(req, res);
	}
};

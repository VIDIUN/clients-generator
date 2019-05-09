/*jshint quotmark:true*/
// ===================================================================================================
//													 _	__		 _ _
//													| |/ /__ _| | |_ _	_ _ _ __ _
//													| ' </ _` | |	_| || | '_/ _` |
//													|_|\_\__,_|_|\__|\_,_|_| \__,_|
//
// This file is part of the Vidiun Collaborative Media Suite which allows users
// to do with audio, video, and animation what Wiki platfroms allow them to do with
// text.
//
// Copyright (C) 2006-2011	Vidiun Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,re
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.	If not, see <http://www.gnu.org/licenses/>.
//
// @ignore
// ===================================================================================================

var crypto = require('crypto');
var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

/**
 * Generates a URL-encoded query string from the associative (or indexed) array provided.
 * Ported from PHP.
 * @param formdata			May be an array or object containing properties.
 * @param numeric_prefix	If numeric indices are used in the base array and this parameter is provided, it will be prepended to the numeric index for elements in the base array only.
 * @param arg_separator		arg_separator.output	is used to separate arguments, unless this parameter is specified, and is then used.
 * @return	Returns a URL-encoded string.
 */


function http_build_query (formdata, numeric_prefix, arg_separator) {
		var value, tmp = [];
		var _http_build_query_helper = function (key, val, arg_separator) {
				var tmp = [];
		if (val === true) {
						val = "1";
				} else if (val === false) {
						val = "0";
				}
		if (val !== null && typeof(val) === "object") {
						for (var k in val) {
								if (val[k] !== null) {
										tmp.push(_http_build_query_helper(key + "[" + k + "]", val[k], arg_separator));
								}
			}
						return tmp.join(arg_separator);
				} else if (typeof(val) !== "function") {
						return key + "=" + encodeURIComponent(val);
				} else {
				//throw new Error('There was an error processing for http_build_query().');
						return "";
				}
		};

		if (!arg_separator) {
		arg_separator = "&";
		}
		for (var key in formdata) {
				value = formdata[key];
				if (numeric_prefix && !isNaN(key)) {
			key = String(numeric_prefix) + key;
				}
				tmp.push(_http_build_query_helper(key, value, arg_separator));
		}
		return tmp.join(arg_separator);
}

/**
 * Getting the name of the constructor if the constructor hasn't been modified,
 * which if it has modified (and is therfor invalid to use), it falls back to using Object.prototype.toString
 * to get the class though it won't return the name of the constructor function that created it then.
 * If you absolutely need the constructor's name, pass true as the second argument,
 * and it will reset the constructor if it has been modified, to get the real constructor.
 * @param obj	The object to get the constructor of.
 * @param forceConstructor	preform a deep lookup for the real constructor.
 * @return	The constructor of the given class.
 */
function getClass(obj, forceConstructor) {
	if ( typeof obj == "undefined" ) { return "undefined"; }
	if ( obj === null ) { return "null"; }
	if ( forceConstructor === true && obj.hasOwnProperty("constructor") ) { delete obj.constructor; } // reset constructor
	if ( forceConstructor !== false && !obj.hasOwnProperty("constructor") ) { return obj.constructor.name; }
	return Object.prototype.toString.call(obj)
		.match(/^\[object\s(.*)\]$/)[1];
}

/**
 * validate a paramter's value is not null, if not null, add the parameter to the collection.
 * @param	params		the collection of parameters to send in a service action request.
 * @param	paramName	the new parameter name to add.
 * @param	paramValue	the new parameter value to add.
 */
function addIfNotNull(obj, params, paramName, paramValue)
{
	if (paramValue !== null) {
		if(paramValue instanceof VidiunObjectBase) {
			params[paramName] = toParams(paramValue);
		} else {
			params[paramName] = paramValue;
		}
	}
}

/**
 * Serializes new object's parameters.
 * @param obj	The object who's members to serialize.
 * @return		a serialized object.
 */
var toParams = module.exports.toParams = function(obj)
{
	var params = {};
	params["objectType"] = getClass(obj);
	for(var prop in obj) {
		var val = obj[prop];
		addIfNotNull(obj, params, prop, val);
	}
	return params;
};

/**
 * Sorts an array by key, maintaining key to data correlations. This is useful mainly for associative arrays.
 * @param arr The array to sort.
 * @return		The sorted array.
 */
function vsort(arr) {
	var sArr = [];
	var tArr = [];
	var n = 0;
	for (var i in arr) {
		tArr[n++] = i+"|"+arr[i];
	}
	tArr = tArr.sort();
	for (var j=0; j<tArr.length; j++) {
		var x = tArr[j].split("|");
		sArr[x[0]] = x[1];
	}
	return sArr;
}

/**
 * Construct new Vidiun service action call, if params array contain sub-arrays (for objects), it will be flattened.
 * @param string	service		The Vidiun service to use.
 * @param string	action			The service action to execute.
 * @param array		params			The parameters to pass to the service action.
 * @param array	 files		 Files to upload or manipulate.
 */
function VidiunServiceActionCall(service, action, params, files){
	if(!params) {
		params = {};
	}
	if(!files) {
		files = {};
	}

	this.service = service;
	this.action = action;
	this.params = this.parseParams(params);
	this.files = files;
}

/**
 * Parse params array and sub arrays (clone objects)
 * @param array params	the object to clone.
 * @return the newly cloned object from the input object.
 */
VidiunServiceActionCall.prototype.parseParams = function(params){
	var newParams = {};
	for(var key in params) {
		var val = params[key];
		if (typeof(val) == "object") {
			newParams[key] = this.parseParams(val);
		} else {
			newParams[key] = val;
		}
	}
	return newParams;
};

/**
 * Create params object for a multirequest call.
 * @param int multiRequestIndex		the index of the call inside the multirequest.
 */
VidiunServiceActionCall.prototype.getParamsForMultiRequest = function(multiRequestIndex){
	var multiRequestParams = {};
	multiRequestParams[multiRequestIndex + ":service"] = this.service;
	multiRequestParams[multiRequestIndex + ":action"] = this.action;
	for(var key in this.params) {
		var val = this.params[key];
		multiRequestParams[multiRequestIndex + ":" + key] = val;
	}
	return multiRequestParams;
};

/**
 * Create files object for a multirequest call.
 * @param int multiRequestIndex		the index of the call inside the multirequest.
 */
VidiunServiceActionCall.prototype.getFilesForMultiRequest = function(multiRequestIndex){
	var multiRequestFiles = {};
	for(var key in this.files) {
		var val = this.files[key];
		multiRequestFiles[multiRequestIndex + ":" + key] = val;
	}
	return multiRequestFiles;
};

/**
 * Implement to get Vidiun Client logs
 *
 */
var IVidiunLogger = module.exports.IVidiunLogger = function() {};
IVidiunLogger.prototype.log = function(msg){
	if (console && console.log){
		console.log(msg);
	}
};

/**
 * Vidiun client constructor
 *
 */
var VidiunClientBase = module.exports.VidiunClientBase = function() {};

/**
 * Vidiun client init
 * @param VidiunConfiguration config
 */
VidiunClientBase.prototype.init = function(config){
	this.config = config;

	this.logEnabled = false;
	this.debugEnabled = false;
	this.useMultiRequest = false;
	this.callsQueue = [];
	this.customHeaders = [];

	var logger = config.getLogger();
	if (logger) {
		this.setLogger(logger);
	}
};

VidiunClientBase.VIDIUN_SERVICE_FORMAT_JSON = 1;
VidiunClientBase.VIDIUN_SERVICE_FORMAT_XML = 2;
VidiunClientBase.VIDIUN_SERVICE_FORMAT_PHP = 3;
VidiunClientBase.VIDIUN_SERVICE_FORMAT_JSONP = 9;

VidiunClientBase.prototype.clientConfiguration = {};
VidiunClientBase.prototype.requestConfiguration = {};

/**
 * Set logger to get vidiun client debug logs.
 * @param IVidiunLogger log
 */
VidiunClientBase.prototype.setLogger = function(logger){
	this.logger = logger;
	this.logEnabled = true;
	if(typeof logger.debug === 'function'){
		this.debugEnabled = true;
	}
};

/**
 * prepare a call for service action (queue the call and wait for doQueue).
 */
VidiunClientBase.prototype.queueServiceActionCall = function (service, action, params, files){
	// in start session partner id is optional (default -1). if partner id was not set, use the one in the config
	for(var paramName in this.requestConfiguration){
		this.addParam(params, paramName, this.requestConfiguration[paramName]);
	}
	var call = new VidiunServiceActionCall(service, action, params, files);
	this.callsQueue.push(call);
};

/**
 * executes the actions queue.
 */
VidiunClientBase.prototype.doQueue = function(callback){
	if (this.callsQueue.length === 0) {
		return null;
	}
	var params = {};
	var files = {};
	this.log("Service url: [" + this.config.serviceUrl + "]");
	// append the basic params
	this.addParam(params, "format", this.config.format);
	for(var paramName in this.clientConfiguration){
		this.addParam(params, paramName, this.clientConfiguration[paramName]);
	}
	var url = this.config.serviceUrl + this.config.serviceBase;
	var call = null;
	if (this.useMultiRequest){
		url += "/multirequest";
		var i = 1;
		for(var v = 0; v < this.callsQueue.length; v++){
			call = this.callsQueue[v];
			var callParams = call.getParamsForMultiRequest(i);
			for(var sv1 in callParams) {
				params[sv1] = callParams[sv1];
			}
			var callFiles = call.getFilesForMultiRequest(i);
			for(var sv2 in callFiles) {
				files[sv2] = call.files[sv2];
			}
			i++;
		}
	} else {
		call = this.callsQueue[0];
		url += "/" + call.service + "/action/" + call.action;
		for(var sv3 in call.params) {
			params[sv3] = call.params[sv3];
		}
		for(var sv4 in call.files) {
			files[sv4] = call.files[sv4];
		}
	}
	// reset
	this.callsQueue = [];
	this.useMultiRequest = false;
	var signature = this.signature(params);
	this.addParam(params, "vidsig", signature);
	this.doHttpRequest(callback, url, params, files);
	this.resetRequest();
	return true;
};

/**
 * Clear all volatile configuration parameters
 */
VidiunClientBase.prototype.resetRequest = function(){
	throw new Error('VidiunClientBase.resetRequest should be overriden by VidiunClient.');
};

/**
 * Sign array of parameters for requests validation (CRC).
 * @param array params		service action call parameters that will be sent on the request.
 * @return string			a hashed signed signature that can identify the sent request parameters.
 */
VidiunClientBase.prototype.signature = function(params){
	params = vsort(params);
	var str = "";
	for(var v in params) {
		var k = params[v];
		str += k + v;
	}
	var md5sum = crypto.createHash("md5");
	md5sum.update(str);
	return md5sum.digest("hex");
};

VidiunClientBase.requestIndex = 1;

VidiunClientBase.prototype.encodeFile = function(boundary, type, name, filename) {
	var returnPart = '--' + boundary + '\r\n';
	returnPart += 'Content-Disposition: form-data name="' + name + '" filename="' + filename + '"\r\n';
	returnPart += 'Content-Type: ' + type + '\r\n\r\n';
	return returnPart;
};

VidiunClientBase.prototype.sendRequestHelper = function (options, body, requestIndex, onCompleteCallback, timeout) {
	var This = this;
	var request = http.request(options, function(response) {
		response.setEncoding('utf8');

		var data = '';
		response.on('data', function(chunk) {
			data += chunk;
		});
		response.on('end', function() {
			var headers = [];
			for ( var header in response.headers) {
				headers.push(header + ': ' + response.headers[header]);
			}
			This.debug('Headers [' + requestIndex + ']: \n\t' + headers.join('\n\t'));
			This.debug('Response [' + requestIndex + ']: ' + data);
			if (This.config.format != VidiunClientBase.VIDIUN_SERVICE_FORMAT_JSON){
				onCompleteCallback(data);
			}else {
				try {
					var obj = JSON.parse(data);
					if (obj && This.isError(obj)) {
						if (!onCompleteCallback) {
							throw obj.code + ": " + obj.message;
						}
						onCompleteCallback(null, obj);
					}
					else {
						onCompleteCallback(obj);
					}
				} catch (err) {
					console.log(err);
					if(!onCompleteCallback){
						throw err;
					}
					onCompleteCallback(null, err);
				}
			}
		});
	});
	request.on('error', function(err) {
		console.log(err);
		if(!onCompleteCallback){
			throw err;
		}
		onCompleteCallback(null, err);
	});

	if (timeout) {
		request.setTimeout(timeout);
	}
	request.write(body);
	request.end();
}

VidiunClientBase.prototype.isError = function(object) {
	if (object){
		if( object.hasOwnProperty("objectType") && object.objectType == 'VidiunAPIException' ) {
			return true;
		}
		else
			return false;
	}
}

/**
 * send the http request.
 * @param string url						the url to call.
 * @param parameters params					the parameters to pass.
 * @return array							 the results and errors inside an array.
 */
VidiunClientBase.prototype.doHttpRequest = function (callCompletedCallback, requestUrl, params, files) {

	var requestIndex = VidiunClientBase.requestIndex++;
	var data = http_build_query(params);
	var debugUrl = requestUrl + '?' + data;
	var urlInfo = url.parse(debugUrl);
	var This = this;
	this.log('Request [' + requestIndex + ']: ' + debugUrl);

	var options = {
		host : urlInfo.host,
		path : urlInfo.path,
		method : 'POST',
		headers : {}
	};

	if(this.config && this.config.proxy && this.config.proxy.host) {
		options.host = this.config.proxy.host;
		options.port = this.config.proxy.port;
		options.path = urlInfo.href;
		options.headers.Host = urlInfo.host;
	}

	Object.keys(this.customHeaders).forEach(function(key) {
		var currHeader = This.customHeaders[key];
		options.headers[key] = currHeader.value;
		if (currHeader.volatile)
			This.removeCustomHeader(key);
	});

	if(Object.keys(files).length > 0){
		var crlf = '\r\n';
		var boundary = '---------------------------' + Math.random();
		var delimiter = crlf + '--' + boundary;
		var postData = [];

		for ( var key in files) {
			var filePath = files[key];
			var fileName = path.basename(filePath);
			var data = fs.readFileSync(filePath);
			var headers = [ 'Content-Disposition: form-data; name="' + key + '"; filename="' + fileName + '"' + crlf, 'Content-Type: application/octet-stream' + crlf ];

			postData.push(new Buffer(delimiter + crlf + headers.join('') + crlf));
			postData.push(new Buffer(data));
		}
		postData.push(new Buffer(delimiter + '--'));
		var multipartBody = Buffer.concat(postData);

		options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
		options.headers['Content-Length'] = multipartBody.length;

		this.sendRequestHelper(options, multipartBody, requestIndex, callCompletedCallback, this.config.timeout);

	} else {
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.headers['Content-Length'] = Buffer.byteLength(data);

		this.sendRequestHelper(options, data, requestIndex, callCompletedCallback);
	}
};

/**
 * getter for the referenced configuration object.
 * @return VidiunConfiguration
 */
VidiunClientBase.prototype.getConfig = function()
{
	return this.config;
};

/**
 * @param VidiunConfiguration config	setter for the referenced configuration object.
 */
VidiunClientBase.prototype.setConfig = function(config){
	this.config = config;

	var logger = config.getLogger();
	if (logger) {
		this.setLogger(logger);
	}
};

/**
 * Add parameter to array of parameters that is passed by reference
 * @param array params			array of parameters to pass to a call.
 * @param string paramName		the name of the new parameter to add.
 * @param string paramValue		the value of the new parameter to add.
 */
VidiunClientBase.prototype.addParam = function(params, paramName, paramValue){
	if (paramValue === null) {
		return;
	}

	// native
	if(typeof(paramValue) != "object") {
		params[paramName] = paramValue;
		return;
	}

	var subParamValue, subParamName = null;

	// object
	if(isNaN(paramValue.length)){
		if(!paramValue.objectType){
			paramValue = toParams(paramValue);
		}
		for(subParamName in paramValue) {
			subParamValue = paramValue[subParamName];
			this.addParam(params, paramName + ":" + subParamName, subParamValue);
		}
		return;
	}

	// array
	if(paramValue.length){
		for(subParamName in paramValue) {
			subParamValue = paramValue[subParamName];
			this.addParam(params, paramName + ":" + subParamName, subParamValue);
		}
	}
	else{
		this.addParam(params, paramName + ":-", "");
	}
};

/**
 * set to true to indicate a multirequest is being defined.
 */
VidiunClientBase.prototype.startMultiRequest = function(){
	this.useMultiRequest = true;
};

/**
 * execute a multirequest.
 */
VidiunClientBase.prototype.doMultiRequest = function(callback){
	return this.doQueue(callback);
};

/**
 * indicate if current mode is constructing a multirequest or single requests.
 */
VidiunClientBase.prototype.isMultiRequest = function(){
	return this.useMultiRequest;
};

/**
 * @param string msg	client logging utility.
 */
VidiunClientBase.prototype.log = function(msg){
	if (this.logEnabled) {
		this.logger.log(msg);
	}
};

/**
 * @param string msg	client logging utility.
 */
VidiunClientBase.prototype.debug = function(msg){
	if (this.debugEnabled) {
		this.logger.debug(msg);
	}
};

/**
 * @param string msg	client logging utility.
 */
VidiunClientBase.prototype.error = function(msg){
	if (this.logEnabled) {
		this.logger.error(msg);
	}
};

/**
 * @param key - name of the header you want to add to the client requests.
 * @param value - value of the header you want to add to the client requests
 * @param volatile - if true the header will be sent for the next request only, if false will be added to all requests by the client.
 */
VidiunClientBase.prototype.addCustomHeader = function(key, value, volatile)
{
	this.customHeaders[key] = { 'value': value, 'volatile': volatile };
}

/**
 * @param key - name of the custom header to be removed.
 */
VidiunClientBase.prototype.removeCustomHeader = function(key)
{
	delete this.customHeaders[key];
}

/**
 * Abstract base class for all client objects
 */
var VidiunObjectBase = module.exports.VidiunObjectBase = function() {};

/**
 * Abstract base class for all client services
 * Initialize the service keeping reference to the VidiunClient
 * @param VidiunClientm client
 */
var VidiunServiceBase = module.exports.VidiunServiceBase = function () {};

VidiunServiceBase.prototype.init = function(client){
	this.client = client;
};
/**
 * @param VidiunClient
 */
VidiunServiceBase.prototype.client = null;

/**
 * Constructs new Vidiun configuration object
 */
var VidiunConfiguration = module.exports.VidiunConfiguration = function (){
	this.serviceUrl = "http://www.vidiun.com";
	this.serviceBase = "/api_v3/service";
	this.format = VidiunClientBase.VIDIUN_SERVICE_FORMAT_JSON;
	this.timeout = 90000;
	this.logger = null;
	this.proxy = null;
};

/**
 * Set logger to get vidiun client debug logs.
 * @param IVidiunLogger log
 */
VidiunConfiguration.prototype.setLogger = function(logger){
	this.logger = logger;
};

/**
 * Gets the logger (Internal client use)
 * @return IVidiunLogger
 */
VidiunConfiguration.prototype.getLogger = function(){
	return this.logger;
};

/**
 * @param host - hostname or ip address of proxy
 * @param port - port of proxy
 */
VidiunConfiguration.prototype.setProxy = function(host, port)
{
	this.proxy = { 'host': host, 'port': port };
}

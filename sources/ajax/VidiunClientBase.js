// ===================================================================================================
//                           _  __     _ _
//                          | |/ /__ _| | |_ _  _ _ _ __ _
//                          | ' </ _` | |  _| || | '_/ _` |
//                          |_|\_\__,_|_|\__|\_,_|_| \__,_|
//
// This file is part of the Vidiun Collaborative Media Suite which allows users
// to do with audio, video, and animation what Wiki platfroms allow them to do with
// text.
//
// Copyright (C) 2006-2011  Vidiun Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// @ignore
// ===================================================================================================

/**
 * Utility global method for extending javascript for allowing easier Inheritance.
 * This method should be called directly after defining the class or object, before extending it's prototype. 
 * @param parentClassOrObject		the parent class or object to inherit from.
 * @return	the object or class being created (the child class).
 */
Function.prototype.inheritsFrom = function( parentClassOrObject ){ 
	if ( parentClassOrObject.constructor == Function ) 
	{ 
		//Normal Inheritance 
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parentClass = parentClassOrObject.prototype;
	} 
	else 
	{ 
		//Pure Virtual Inheritance 
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parentClass = parentClassOrObject;
	} 
	return this;
}

/**
 * Sorts an array by key, maintaining key to data correlations. This is useful mainly for associative arrays. 
 * @param arr 	The array to sort.
 * @return		The sorted array.
 */
function vsort(arr) {
  var sArr = [];
  var tArr = [];
  var n = 0;
  for (i in arr)
	  tArr[n++] = i+' |'+arr[i];
  tArr = tArr.sort();
  for (var i=0; i<tArr.length; i++) {
	var x = tArr[i].split(' |');
    sArr[x[0]] = x[1];
  }
  return sArr;
}

/**
 * Implement to get Vidiun Client logs
 * 
 */
function IVidiunLogger(){
}
IVidiunLogger.prototype.log = function(msg){
	if (console && console.log){
		console.log(msg);
	}
};

/**
 * Vidiun client constructor
 * 
 */
function VidiunClientBase(){
}

/**
 * Vidiun client init
 * @param VidiunConfiguration config
 */
VidiunClientBase.prototype.init = function(config){
    this.config = config;
    var logger = this.config.getLogger();
	if (logger) {
		this.shouldLog = true;	
	}
};

VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_JSON = 1;
VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_XML = 2;
VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_PHP = 3;
VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_JSONP = 9;

/**
 * @param VidiunConfiguration The Vidiun Client - this is the facade through which all service actions should be called.
 */
VidiunClientBase.prototype.config = null;
	
/**
 * @param object Vidiun general request arguments
 */
VidiunClientBase.prototype.requestData = {};
	
/**
 * @param boolean	should the client log all actions.
 */
VidiunClientBase.prototype.shouldLog = false;
	
/**
 * getter for the referenced configuration object. 
 * @return VidiunConfiguration
 */
VidiunClientBase.prototype.getConfig = function(){
	return this.config;
};

/**
 * @param VidiunConfiguration config	setter for the referenced configuration object.
 */
VidiunClientBase.prototype.setConfig = function(config){
	this.config = config;
	logger = this.config.getLogger();
	if (logger instanceof IVidiunLogger){
		this.shouldLog = true;	
	}
};

/**
 * return a new multi-request builder
 */
VidiunClientBase.prototype.startMultiRequest = function(){
	return new VidiunMultiRequestBuilder();
};

/**
 * @param string msg	client logging utility. 
 */
VidiunClientBase.prototype.log = function(msg){
	if (this.shouldLog)
		this.config.getLogger().log(msg);
};

/**
 * Constructs new Vidiun configuration object
 */
function VidiunConfiguration(){
}

VidiunConfiguration.prototype.logger		= null;
VidiunConfiguration.prototype.serviceUrl	= 'http://www.vidiun.com';
VidiunConfiguration.prototype.serviceBase 	= '/api_v3/service';

/**
 * Set logger to get vidiun client debug logs.
 * @param IVidiunLogger log
 */
VidiunConfiguration.prototype.setLogger = function(log){
	this.logger = log;
};

/**
 * Gets the logger (Internal client use)
 * @return IVidiunLogger
 */
VidiunConfiguration.prototype.getLogger = function(){
	return this.logger;
};

function VidiunRequestBuilder(service, action, data, files){
	if(!service)
		return;
	
	this.service = service;
	this.action = action;
	this.data = data;
	this.files = files;
	this.requestData = {};
}

VidiunRequestBuilder.prototype.callback = null;

/**
 * Sign array of parameters for requests validation (CRC).
 * @param array params		service action call parameters that will be sent on the request.
 * @return string			a hashed signed signature that can identify the sent request parameters.
 */
VidiunRequestBuilder.prototype.signature = function(params){
	params = vsort(params);
	var str = '';
	for(var v in params) {
		var k = params[v];
		if(typeof(k) === 'object' || $.isArray(k))
			k = this.signature(k);
		
		str += v + k;
	}
	return MD5(str);
};

/**
 * send the http request.
 * @return array 							the results and errors inside an array.
 */
VidiunRequestBuilder.prototype.doHttpRequest = function(client){
	var json = this.getData(true);
	var callback = this.callback;
	var url = this.getUrl(client);

	client.log('URL: ' + url);
	client.log('Request JSON: ' + JSON.stringify(json));
	
	var data;
	var processData;
	var contentType;
	
	if(this.files) {
		processData = false;
		contentType = false;
		data = new FormData();
		data.append("json", JSON.stringify(json));
		for(var paramName in this.files) {
			data.append(paramName, this.files[paramName].files[0]);
		}
	}
	else {
		processData = true;
		contentType = 'application/json';
		data = JSON.stringify(json);
	}
	
	$.ajax({
	    type: 'POST',
	    url: url,
	    crossDomain: true,
	    data: data,
	    processData: processData,
	    contentType: contentType,
	    dataType: 'json',
	    success: function(json, textStatus, jqXHR) {
	    	client.log('Response JSON: ' + JSON.stringify(json));
	    	
	    	if(json && typeof(json) === 'object' && json.code && json.message){
		    	if(callback)
		    		callback(false, json);
		    	else
		    		throw new Error(json.message);
	    	}
	    	else if(callback)
	    		callback(true, json);
	    },
	    error: function (responseData, textStatus, errorThrown) {
	    	if(callback)
	    		callback(false, errorThrown);
	    	else
	    		throw errorThrown;
	    }
	});
};

VidiunRequestBuilder.prototype.sign = function(){
	var signature = this.signature(this.data);
	this.data.vidsig = signature;
};

VidiunRequestBuilder.prototype.getUrl = function(client){
	var url = client.config.serviceUrl + client.config.serviceBase;
	url += '/' + this.service + '/action/' + this.action;
	
	return url;
};

VidiunRequestBuilder.prototype.getData = function(sign){
	this.data.format = VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_JSON;

	$.extend(this.data, this.requestData);

	if(sign)
		this.sign();
	
	return this.data;
};

VidiunRequestBuilder.prototype.execute = function(client, callback){
	var requestData = $.extend({}, client.requestData); // clone client requestData
	this.requestData = $.extend(requestData, this.requestData); // merge client requestData with current requestData
	
	if(callback)
		this.completion(callback);
	
	this.doHttpRequest(client);
};

VidiunRequestBuilder.prototype.completion = function(callback){
	this.callback = callback;
	return this;
};

VidiunRequestBuilder.prototype.add = function(requestBuilder){
	var multiRequestBuilder = new VidiunMultiRequestBuilder();
	multiRequestBuilder.add(this);
	multiRequestBuilder.add(requestBuilder);
	return multiRequestBuilder;
};



function VidiunMultiRequestBuilder(){
	this.requestData = {};
	this.requests = [];
	this.generalCallback = null;
	
	var This = this;
	This.callback = function(success, results){
		if(!success)
			throw new Error(results);

		for(var i = 0; i < This.requests.length; i++){
				if(This.requests[i].callback){
					if(results[i] && typeof(results[i]) == 'object' && results[i].code && results[i].message)
						This.requests[i].callback(false, results[i]);
					else
						This.requests[i].callback(true, results[i]);
				}
		}
		
		if(This.generalCallback) {
			if(results && typeof(results) == 'object' && results.code && results.message)
				This.generalCallback(false, results)
			else
				This.generalCallback(true, results)
		}
	};
}

VidiunMultiRequestBuilder.inheritsFrom (VidiunRequestBuilder);

VidiunMultiRequestBuilder.prototype.completion = function(callback){
	this.generalCallback = callback;
	
	return this;
};

VidiunMultiRequestBuilder.prototype.add = function(requestBuilder){
	this.requests.push(requestBuilder);
	return this;
};

VidiunMultiRequestBuilder.prototype.getUrl = function(client){
	var url = client.config.serviceUrl + client.config.serviceBase;
	url += '/multirequest';
	
	return url;
};

VidiunMultiRequestBuilder.prototype.getData = function(){
	this.data = {
		format: VidiunClientBase.prototype.VIDIUN_SERVICE_FORMAT_JSON
	}
	
	for(var i = 0; i < this.requests.length; i++){
		this.data[i] = this.requests[i].getData();
		this.data[i].service = this.requests[i].service;
		this.data[i].action = this.requests[i].action;
	}

	$.extend(this.data, this.requestData);
	
	this.sign();
	return this.data;
};
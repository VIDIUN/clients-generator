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
package com.vidiun.net {
	
	import com.vidiun.VidiunClient;
	import com.vidiun.config.VidiunConfig;
	import com.vidiun.delegates.IVidiunCallDelegate;
	import com.vidiun.errors.VidiunError;
	import com.vidiun.events.VidiunEvent;
	import com.vidiun.utils.ObjectUtil;
	
	import flash.events.EventDispatcher;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.utils.getQualifiedClassName;
	
	public class VidiunCall extends EventDispatcher {
		
		public var args:URLVariables = new URLVariables();
		public var result:Object;
		public var error:VidiunError;
		public var config:VidiunConfig;
		public var success:Boolean = false;
		public var action : String;
		public var service : String;
		public static var defaultMethod : String = URLRequestMethod.POST;
		public var method : String = defaultMethod;
		
		public var useTimeout:Boolean = true;
		
		public var delegate : IVidiunCallDelegate;
		
		/**
		 * when the client is in queueing mode, determined whether the call is queued. 
		 */
		public var queued:Boolean = true;
		
		
		public function VidiunCall() {}
		
		/**
		 * OVERRIDE this function in case something needs to be initialized prior to execution
		 * */
		public function initialize():void {}
		
		/**
		 * OVERRIDE this function to make init the right delegate action
		 * */
		public function execute():void {}
		
		public function setRequestArgument(name:String, value:*):void {
			if (value is Number)
			{
				if (value == Number.NEGATIVE_INFINITY ) { return; }
				if (value == VidiunClient.NULL_NUMBER ) { this.args[name + '__null'] = '';  return; }
			}
			if ( value is int)
			{
				if (value == int.MIN_VALUE ) { return; }
				if (value == VidiunClient.NULL_INT ) { this.args[name + '__null'] = '';  return; }
			}
			if (value === null) {	return;	 }
			if (value === VidiunClient.NULL_STRING) {	this.args[name + '__null'] = '';  return;	 }
			
			if (name) { //&& String(value).length > 0
				this.args[name] = value; 
			}
		}
		
		protected function clearRequestArguments():void {
			this.args = new URLVariables();
		}
		
		public function handleResult(result:Object):void {
			this.result = result;
			success = true;
			dispatchEvent(new VidiunEvent(VidiunEvent.COMPLETE, false, false, true, result));
		}
		/**
		 * dispatch an Error when a request has faild for any reason  
		 * @param error
		 * 
		 */		
		public function handleError(error:VidiunError):void {
			this.error = error;
			success = false;
			error.requestArgs = args;
			dispatchEvent(new VidiunEvent(VidiunEvent.FAILED, false, false, false, null, error));
		}
		
		/**
		 * Create from prefix and vidiun object an arry of key value arrays that ready to be send to the server request API 
		 * can deal with nesting objects and arrays
		 * @param any Vidiun object 
		 * @prefix added before the original params to format the params to send
		 * @return Array of formated params that supported by vidiun server
		 * 
		 */		
		protected function vidiunObject2Arrays( obj : Object , prefix : String = null) : Array {	
			var keyValArr : Array = new Array();
			var valArray : Array = new Array();
			var keyArray : Array = new Array();
			var objArr : Array;
			var objKeys : Array;
			
			if(obj["getUpdatedFieldsOnly"]() || obj["getInsertedFields"]()) {
				objKeys = [];
				if (obj["getUpdatedFieldsOnly"]() ) {
					objKeys = objKeys.concat( obj["getUpdateableParamKeys"]());
				}
				if (obj["getInsertedFields"]() ) {
					objKeys = objKeys.concat( obj["getInsertableParamKeys"]());
				}
				
			}
			else
				objKeys = ObjectUtil.getObjectAllKeys( obj );
			
			var j:int=0;
			for (var i:int=0; i<objKeys.length; i++)
			{
				var value : * = obj[objKeys[i].toString()];
				
				if(value === undefined)
				{
					continue;
				}
				
				if(value is String || value is Number || value is Boolean || value is int || value === null)
				{
					keyArray[j] = prefix + ":" + objKeys[i];
					valArray[j] = value;
					++j;
				}
				else if( value is Array)
				{
					var arr : Array = extractArray( value , prefix + ":" + objKeys[i]);
					keyArray = keyArray.concat( arr[0] );
					valArray = valArray.concat( arr[1] );
					j = valArray.length;
				}
				else //must be a Vidiun Object
				{
					objArr= getQualifiedClassName(value).split("::");
					var tempPrefix : String = objKeys[i].toString();
					var tempKeyValArr : Array = vidiunObject2Arrays( value , prefix + ":" + tempPrefix );
					keyArray = keyArray.concat(tempKeyValArr[0]);
					valArray = valArray.concat(tempKeyValArr[1]);
					j = valArray.length;
				}
			}
			
			//adding objectType to both arrays
			keyArray[keyArray.length] = prefix + ":" + "objectType";  //add the objectType key
			objArr = getQualifiedClassName( obj ).split("::");	
			valArray[valArray.length] = objArr[objArr.length-1]; //add the objectType value	
			
			keyValArr = [ keyArray , valArray];
			return keyValArr;
		}
		
		/**
		 * Get Array and extract the objects needed to be parsed, can deal with nesting objects and arrays
		 * @param arr
		 * @return 
		 * 
		 */		
		protected function extractArray( arr : Array , prefix : String ) : Array {
			
			var keyValArr : Array = new Array();
			var keyArray : Array = new Array();
			var valArray : Array = new Array();
			var tempArr : Array;
			var j:int=0;
			for( var i:int=0; i<arr.length; i++)
			{
				var newPrefix : String = prefix+":"+i;
				if(arr[i] is String || arr[i] is Number || arr[i] is Boolean || arr[i] is int)
				{
					keyArray[j] = newPrefix;
					valArray[j] = arr[i];
					j++;
				}
				else if( arr[i] is Array ) //if this is Array
				{							
					tempArr =  extractArray( arr[i] , newPrefix);
					keyArray = keyArray.concat( tempArr[0] );
					valArray = valArray.concat( tempArr[1] );
					j = valArray.length;
				}
				else if( arr[i] != null ) //must be an object
				{
					//var objArr : Array = getQualifiedClassName(arr[i]).split("::");
					//var tempPrefix : String = objArr[objArr.length-1];
					tempArr  = vidiunObject2Arrays( arr[i] , newPrefix ); //  + ":" +tempPrefix
					
					keyArray = keyArray.concat( tempArr[0] );
					valArray = valArray.concat( tempArr[1] );
					j = valArray.length;
				}
			}
			
			if (arr.length == 0)
			{
				keyArray[j] = prefix + ":-";
				valArray[j] = "";
				j++;
			}
			
			keyValArr = [ keyArray , valArray];
			return keyValArr;
		}
		
		
		protected function applySchema(p_shema:Array,p_args:Array):void 
		{	
			var l:uint = p_shema.length;
			
			for (var i:uint=0;i<l;i++) {
				setRequestArgument(p_shema[i], p_args[i]);
			}
		}
	}
}
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
package com.vidiun.delegates.baseEntry
{
	import com.vidiun.config.VidiunConfig;
	import com.vidiun.core.VClassFactory;
	import com.vidiun.delegates.WebDelegateBase;
	import com.vidiun.errors.VidiunError;
	import com.vidiun.net.VidiunCall;
	import com.vidiun.net.VidiunFileCall;
	
	import flash.events.Event;
	import flash.net.URLLoaderDataFormat;
	import flash.utils.getDefinitionByName;
	
	import mx.utils.UIDUtil;
	
	import ru.inspirit.net.MultipartURLLoader;
	
	public class BaseEntryUpdateThumbnailJpegDelegate extends WebDelegateBase
	{
		protected var mrloader:MultipartURLLoader;
		
		public function BaseEntryUpdateThumbnailJpegDelegate(call:VidiunCall, config:VidiunConfig)
		{
			super(call, config);
		}

		override public function parse( result : XML ) : *
		{
			var cls : Class = getDefinitionByName('com.vidiun.vo.'+ result.result.objectType) as Class;
			var obj : * = (new VClassFactory( cls )).newInstanceFromXML( result.result );
			return obj;
		}
		
		override protected function sendRequest():void {
			//construct the loader
			createURLLoader();

			//create the service request for normal calls
			var variables:String = decodeURIComponent(call.args.toString());
			var req:String = _config.protocol + _config.domain +"/"+_config.srvUrl+"/service/"+call.service+"/action/"+call.action +'?'+variables;
			mrloader.addFile((call as VidiunFileCall).bytes, UIDUtil.createUID(), 'fileData');

			mrloader.dataFormat = URLLoaderDataFormat.TEXT;
			mrloader.load(req);
		}

		// Event Handlers
		override protected function onDataComplete(event:Event):void {
			try{
				handleResult( XML(event.target.loader.data) );
			}
			catch( e:Error )
			{
				var vErr : VidiunError = new VidiunError();
				vErr.errorCode = String(e.errorID);
				vErr.errorMsg = e.message;
				_call.handleError( vErr );
			}
		}

		override protected function createURLLoader():void {
			mrloader = new MultipartURLLoader();
			mrloader.addEventListener(Event.COMPLETE, onDataComplete);
		}

	}
}

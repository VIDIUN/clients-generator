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
package com.vidiun.events {
	
	import com.vidiun.errors.VidiunError;
	
	import flash.events.Event;

	public class VidiunEvent extends Event {
		
		public static const COMPLETE:String = 'complete';
		public static const FAILED:String = 'failed';

		public var success:Boolean;
		public var data:Object;
		public var error:VidiunError;
		
		public function VidiunEvent(type:String,
									 bubbles:Boolean=false,
									 cancelable:Boolean=false,
									 success:Boolean = false,
									 data:Object = null, 
									 error:VidiunError = null) 
		{
			this.success = success;
			this.data = data;
			this.error = error;
			
			super(type, bubbles, cancelable);
		}
		
		override public function clone():Event {
			return new VidiunEvent(type, bubbles, cancelable, success, data, error);
		}
		
		override public function toString():String {
			return formatToString('VidiunEvent', 'type', 'success', 'data', 'error');
		}
		
	}
}
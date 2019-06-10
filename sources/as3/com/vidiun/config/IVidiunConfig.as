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
package com.vidiun.config {
	
	import flash.events.IEventDispatcher;
	
	public interface IVidiunConfig extends IEventDispatcher 
	{	
		function get partnerId():String; 
		function set partnerId(value:String):void;

		function get srvUrl():String;
		function set srvUrl(value:String):void;
		
		function set protocol(value:String):void;
		function get protocol():String;
		
		function get domain():String;
		function set domain(value:String):void;
	
		function get vs():String;
		function set vs(value:String):void;

	    function get ignoreNull():int;
	    function set ignoreNull(value:int):void;
	}
}
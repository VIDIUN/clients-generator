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
// Copyright (C) 2006-2016  Vidiun Inc.
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
using System;
using Vidiun.Types;
using Vidiun.Enums;

namespace Vidiun
{
	public class Client : ClientBase
	{
		public Client(Configuration config) : base(config)
		{
				ApiVersion = "@VERSION@";
				ClientTag = "dotnet:16-12-12";
		}
	
		#region Properties
			
 		public string ClientTag
 		{
 			get
 			{
 				return clientConfiguration.ClientTag;
 			}
 			set
 			{
 				clientConfiguration.ClientTag = value;
 			}
 		}
			
 		public string ApiVersion
 		{
 			get
 			{
 				return clientConfiguration.ApiVersion;
 			}
 			set
 			{
 				clientConfiguration.ApiVersion = value;
 			}
 		}
			
 		public int PartnerId
 		{
 			get
 			{
 				return requestConfiguration.PartnerId;
 			}
 			set
 			{
 				requestConfiguration.PartnerId = value;
 			}
 		}
			
 		public string VS
 		{
 			get
 			{
 				return requestConfiguration.Vs;
 			}
 			set
 			{
 				requestConfiguration.Vs = value;
 			}
 		}
			
 		public string SessionId
 		{
 			get
 			{
 				return requestConfiguration.Vs;
 			}
 			set
 			{
 				requestConfiguration.Vs = value;
 			}
 		}
			
 		public BaseResponseProfile ResponseProfile
 		{
 			get
 			{
 				return requestConfiguration.ResponseProfile;
 			}
 			set
 			{
 				requestConfiguration.ResponseProfile = value;
 			}
 		}
		#endregion
	}
}

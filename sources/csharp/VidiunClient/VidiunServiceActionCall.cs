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
using System;
using System.Collections.Generic;
using System.Text;
using System.IO;

namespace Vidiun
{
    public class VidiunServiceActionCall
    {
        #region Private Fields

        private string _Service;
        private string _Action;
        private VidiunParams _Params;
        private VidiunFiles _Files;

        #endregion

        #region Properties

        public string Service
        {
            get { return _Service; }
        }

        public string Action
        {
            get { return _Action; }
        }

        public VidiunParams Params
        {
            get { return _Params; }
        }

        public VidiunFiles Files
        {
            get { return _Files; }
        }

        public VidiunParams GetParamsForMultiRequest(int multiRequestNumber)
        {  
            _Params.Add("service", this._Service);
            _Params.Add("action", this._Action);
          
            VidiunParams multiRequestParams = new VidiunParams();
            multiRequestParams.Add(multiRequestNumber.ToString(), this._Params);

            return multiRequestParams;
        }

        public VidiunFiles GetFilesForMultiRequest(int multiRequestNumber)
        {
            VidiunFiles multiRequestParams = new VidiunFiles();
            foreach (KeyValuePair<string, Stream> param in this._Files)
            {
                multiRequestParams.Add(multiRequestNumber + ":" + param.Key, param.Value);
            }

            return multiRequestParams;
        }

        #endregion

        #region CTor

        public VidiunServiceActionCall(string service, string action, VidiunParams vparams)
            : this(service, action, vparams, new VidiunFiles())
        {

        }

        public VidiunServiceActionCall(string service, string action, VidiunParams vparams, VidiunFiles vfiles)
        {
            this._Service = service;
            this._Action = action;
            this._Params = vparams;
            this._Files = vfiles;
        }

        #endregion
    }
}

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
using System.Web;
using System.Globalization;

namespace Vidiun
{
    public class VidiunParam : IVidiunSerializable
    {

        #region Private Fields

        private string _Value;
        private Nullable<bool> _BoolValue = null;
        private long _LongValue;
        private int _IntValue;
        private float _FloatValue;
        private double _DoubleValue;


        private string _ParamType;
        private const string PARAM_TYPE_STRING = "string";
        private const string PARAM_TYPE_BOOL = "bool";
        private const string PARAM_TYPE_LONG = "long";
        private const string PARAM_TYPE_INT = "int";
        private const string PARAM_TYPE_FLOAT = "float";
        private const string PARAM_TYPE_DOUBLE = "double";


        #endregion


        #region CTor

        public VidiunParam(string value)
        {
            _Value = value;
            _ParamType = PARAM_TYPE_STRING;
        }
        public VidiunParam(bool value)
        {
            _BoolValue = value;
            _ParamType = PARAM_TYPE_BOOL;
        }
        public VidiunParam(long value)
        {
            _LongValue = value;
            _ParamType = PARAM_TYPE_LONG;
        }
        public VidiunParam(int value)
        {
            _IntValue = value;
            _ParamType = PARAM_TYPE_INT;
        }
        public VidiunParam(float value)
        {
            _FloatValue = value;
            _ParamType = PARAM_TYPE_FLOAT;
        }

        public VidiunParam(double value)
        {
            _DoubleValue = value;
            _ParamType = PARAM_TYPE_DOUBLE;
        }

        #endregion

        public string ToJson()
        {
            switch(_ParamType)
            {
                case PARAM_TYPE_BOOL:
                    return _BoolValue.Value ? "true" : "false";
                case PARAM_TYPE_INT:
                    return _IntValue.ToString();
                case PARAM_TYPE_LONG:
                    return _LongValue.ToString();
                case PARAM_TYPE_FLOAT:
                    return String.Format(CultureInfo.InvariantCulture,"{0:F20}", _FloatValue);
                case PARAM_TYPE_DOUBLE:
                    return String.Format(CultureInfo.InvariantCulture,"{0:F20}", _DoubleValue);
                case PARAM_TYPE_STRING:
                default:
                    return "\"" + _Value.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\t", "\\t").Replace("\n", "\\n") + "\"";
            }
        }

        public string ToQueryString()
        {
            return _Value;
        }

        new public string ToString()
        {
            return _Value;
        }
    }
}

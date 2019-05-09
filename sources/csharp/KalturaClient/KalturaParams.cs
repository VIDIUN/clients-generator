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
    public class VidiunParams : SortedList<string, IVidiunSerializable>, IVidiunSerializable
    {
        private bool isArray;

        public string ToJson()
        {
            string[] values = new string[this.Count];
            int index = 0;
            foreach (KeyValuePair<string, IVidiunSerializable> item in this)
            {
                if (isArray)
                    values[index++] = item.Value.ToJson();
                else
                    values[index++] = "\"" + item.Key + "\":" + item.Value.ToJson();
            }

            if (isArray)
                return string.Format("[{0}]", string.Join(",", values));
            else
                return string.Format("{{{0}}}", string.Join(",", values));
        }

        public string ToQueryString()
        {
            string str = "";
            foreach (KeyValuePair<string, IVidiunSerializable> item in this)
                str += (item.Key + "=" + HttpUtility.UrlEncode(item.Value.ToQueryString()) + "&");

            if (str.EndsWith("&"))
                str = str.Substring(0, str.Length - 1);

            return str;
        }

        public void Add(VidiunParams properties)
        {
            foreach (string key in properties.Keys)
                Add(key, properties[key]);
        }

        public void Add(string key, VidiunObjectBase vidiunObject)
        {
            VidiunParams objectProperties = vidiunObject.ToParams();
            Add(key, objectProperties);
        }

        public void AddIfNotNull(string key, VidiunObjectBase vidiunObject)
        {
            if (vidiunObject != null)
            {
                Add(key, vidiunObject);
            }
        }

        public void AddIfNotNull<T>(string key, IList<T> array) where T : VidiunObjectBase
        {
            if (array == null)
                return;

            VidiunParams arrayParams = new VidiunParams() { isArray = true };
            if (array.Count == 0)
            {
                arrayParams.Add("-", "");
            }
            else
            {
                int i = 0;
                foreach (VidiunObjectBase item in array)
                {
                    arrayParams.Add(i.ToString(), item);
                    i++;
                }
            }
            this.Add(key, arrayParams);
        }

        public void AddIfNotNull<T>(string key, IDictionary<string, T> map) where T : VidiunObjectBase
        {
            if (map == null)
                return;

            VidiunParams arrayParams = new VidiunParams();
            if (map.Count == 0)
            {
                arrayParams.Add("-", "");
            }
            else
            {
                foreach (string itemKey in map.Keys)
                {
                    arrayParams.Add(itemKey, map[itemKey]);
                }
            }
            this.Add(key, arrayParams);
        }

        public void Add(string key, string value)
        {
            this.Add(key, new VidiunParam(value));
        }

        public void Add(string key, bool value)
        {
            this.Add(key, new VidiunParam(value));
        }
        public void Add(string key, int value)
        {
            this.Add(key, new VidiunParam(value));
        }
        public void Add(string key, long value)
        {
            this.Add(key, new VidiunParam(value));
        }
        public void Add(string key, float value)
        {
            this.Add(key, new VidiunParam(value));
        }
        public void Add(string key, double value)
        {
            this.Add(key, new VidiunParam(value));
        }

        public void AddIfNotNull(string key, string value)
        {
            if (value != null)
                this.Add(key, new VidiunParam(value));
        }

        public void AddIfNotNull(string key, int value)
        {
            if (value != int.MinValue)
                this.Add(key, value);
        }


        public void AddIfNotNull(string key, float value)
        {
            if (value != Single.MinValue)
                this.Add(key, value);
        }

        public void AddIfNotNull(string key, double value)
        {
            if (value != Single.MinValue)
                this.Add(key, String.Format(CultureInfo.InvariantCulture,"{0:F20}", value));
        }

        public void AddIfNotNull(string key, long value)
        {
            if (value != long.MinValue)
                this.Add(key, value.ToString());
        }

        public void AddIfNotNull(string key, Enum value)
        {
            this.AddIfNotNull(key, value.GetHashCode());
        }

        public void AddIfNotNull(string key, VidiunStringEnum value)
        {
            if (value != null)
                this.Add(key, value.ToString());
        }

        public void AddIfNotNull(string key, bool? value)
        {
            if (value.HasValue)
                this.Add(key, value.Value);
        }

        public void AddReplace(string key, string value)
        {
            if (this.Keys.Contains(key))
                this.Remove(key);
            this.Add(key, value);
        }
    }
}
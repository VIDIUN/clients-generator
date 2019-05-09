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
using System.Net;
using System.Web;
using System.IO;
using System.Security.Cryptography;
using System.Xml;
using System.Xml.XPath;
using System.Runtime.Serialization;
using System.Threading;

namespace Vidiun
{
    public class VidiunClientBase
    {
        #region Private Fields

        protected IDictionary<string, Object> clientConfiguration;
        protected IDictionary<string, Object> requestConfiguration;

        protected VidiunConfiguration _Config;
        private bool _ShouldLog;
        private List<VidiunServiceActionCall> _CallsQueue;
        private List<string> _MultiRequestReturnType;
        private VidiunParams _MultiRequestParamsMap;
        private WebHeaderCollection _ResponseHeaders;

        #endregion

        #region Properties

        public bool IsMultiRequest
        {
            get { return (_MultiRequestReturnType != null); }
        }

        public WebHeaderCollection ResponseHeaders
        {
            get { return _ResponseHeaders; }
        }

        #endregion

        #region CTor

        public VidiunClientBase(VidiunConfiguration config)
        {
            clientConfiguration = new Dictionary<string, Object>();
            requestConfiguration = new Dictionary<string, Object>();

            _Config = config;
            if (_Config.Logger != null)
            {
                _ShouldLog = true;
            }
            _CallsQueue = new List<VidiunServiceActionCall>();
            _MultiRequestParamsMap = new VidiunParams();
        }

        #endregion

        #region Methods

        public void QueueServiceCall(string service, string action, string fallbackClass, VidiunParams vparams)
        {
            this.QueueServiceCall(service, action, fallbackClass, vparams, new VidiunFiles());
        }

        public void QueueServiceCall(string service, string action, string fallbackClass, VidiunParams vparams, VidiunFiles vfiles)
        {
            Object value;
            foreach (string param in requestConfiguration.Keys)
            {
                value = requestConfiguration[param];
                if (value is VidiunObjectBase)
                {
                    vparams.Add(param, ((VidiunObjectBase)value).ToParams());
                }
                else
                {
                    vparams.Add(param, value.ToString());
                }
            }

            VidiunServiceActionCall call = new VidiunServiceActionCall(service, action, vparams, vfiles);
            if (_MultiRequestReturnType != null)
                _MultiRequestReturnType.Add(fallbackClass);
            this._CallsQueue.Add(call);
        }

        public XmlElement DoQueue()
        {
            if (_CallsQueue.Count == 0)
            {
                resetRequest();
                return null;
            }

            DateTime startTime = DateTime.Now;

            this.Log("service url: [" + this._Config.ServiceUrl + "]");

            VidiunParams vparams = new VidiunParams();
            VidiunFiles vfiles = new VidiunFiles();

            foreach (string param in clientConfiguration.Keys)
            {
                vparams.Add(param, clientConfiguration[param].ToString());
            }
            vparams.AddIfNotNull("format", this._Config.ServiceFormat.GetHashCode());

            string url = this._Config.ServiceUrl + "/api_v3";

            if (_MultiRequestReturnType != null)
            {
                url += "/service/multirequest";
                int i = 1;
                foreach (VidiunServiceActionCall call in _CallsQueue)
                {
                    VidiunParams callParams = call.GetParamsForMultiRequest(i);
                    vparams.Add(callParams);
                    VidiunFiles callFiles = call.GetFilesForMultiRequest(i);
                    vfiles.Add(callFiles);
                    i++;
                }

                // map params
                foreach (KeyValuePair<string, IVidiunSerializable> item in _MultiRequestParamsMap)
                {
                    string requestParam = item.Key;
                    IVidiunSerializable resultParam = item.Value;

                    if (vparams.ContainsKey(requestParam))
                    {
                        vparams[requestParam] = resultParam;
                    }
                }
            }
            else
            {
                VidiunServiceActionCall call = _CallsQueue[0];
                url += "/service/" + call.Service + "/action/" + call.Action;
                vparams.Add(call.Params);
                vfiles.Add(call.Files);
            }

            vparams.Add("vidsig", this.Signature(vparams));
            string json = vparams.ToJson();

            this.Log("full reqeust url: [" + url + "]");
            this.Log("full reqeust data: [" + json + "]");

            // build request
            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(url);
            if (vfiles.Count == 0)
            {
                request.Timeout = _Config.Timeout;
            }
            else
            {
                request.Timeout = Timeout.Infinite;
            }
            request.Method = "POST";
            request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;
            request.Headers = _Config.RequestHeaders;
            request.Accept = "application/xml";

            // Add proxy information if required
            createProxy(request, _Config);

            if (vfiles.Count > 0)
            {
                this.PostMultiPartWithFiles(request, json, vfiles);
            }
            else
            {
                this.PostUrlEncodedParams(request, json);
            }

            // get the response
            using (WebResponse response = request.GetResponse())
            {
                Encoding enc = System.Text.Encoding.UTF8;
                StreamReader responseStream = new StreamReader(response.GetResponseStream(), enc);
                string responseString = responseStream.ReadToEnd();

                this._ResponseHeaders = response.Headers;
                string serverName = null;
                string serverSession = null;
                for (int i = 0; i < this._ResponseHeaders.Count; ++i)
                {
                    if (this._ResponseHeaders.Keys[i] == "X-Me")
                        serverName = this._ResponseHeaders[i];
                    if (this._ResponseHeaders.Keys[i] == "X-Vidiun-Session")
                        serverSession = this._ResponseHeaders[i];
                }
                if (serverName != null || serverSession != null)
                    this.Log("server: [" + serverName + "], session: [" + serverSession + "]");

                this.Log("result (serialized): " + responseString);

                DateTime endTime = DateTime.Now;

                this.Log("execution time for [" + url + "]: [" + (endTime - startTime).ToString() + "]");

                XmlDocument xml = new XmlDocument();
                xml.LoadXml(responseString);

                this.ValidateXmlResult(xml);
                XmlElement result = xml["xml"]["result"];
                this.ThrowExceptionOnAPIError(result);

                if(!IsMultiRequest)
                    resetRequest();

                return result;
            }
        }
        private void createProxy(HttpWebRequest request, VidiunConfiguration _Config)
        {
            if (String.IsNullOrEmpty(_Config.ProxyAddress))
                return;
            Console.WriteLine("Create proxy");
            if (!(String.IsNullOrEmpty(_Config.ProxyUser) || String.IsNullOrEmpty(_Config.ProxyPassword)))
            {
                ICredentials credentials = new NetworkCredential(_Config.ProxyUser, _Config.ProxyPassword);
                request.Proxy = new WebProxy(_Config.ProxyAddress, false, null, credentials);
            }
            else
            {
                request.Proxy = new WebProxy(_Config.ProxyAddress);
            }
        }

        public void StartMultiRequest()
        {
            _MultiRequestReturnType = new List<string>();
        }

        public VidiunMultiResponse DoMultiRequest()
        {
            XmlElement multiRequestResult = DoQueue();

            VidiunMultiResponse multiResponse = new VidiunMultiResponse();
            if (multiRequestResult == null)
            {
                resetRequest();
                return multiResponse;
            }
            
            multiResponse = ParseMultiRequestResult(multiRequestResult);
            resetRequest();
            return multiResponse;
        }
        
        private VidiunMultiResponse ParseMultiRequestResult(XmlElement childNode) 
        {
            return ParseMultiRequestResult(childNode, true);
        }
        
        private VidiunMultiResponse ParseMultiRequestResult(XmlElement childNode, bool incrementI)  
        {
            int i = 0;
            VidiunMultiResponse multiResponse = new VidiunMultiResponse();
            foreach(XmlElement arrayNode in childNode.ChildNodes) 
            {
                XmlElement error = arrayNode["error"];
                if (error != null && error["code"] != null && error["message"] != null) 
                    multiResponse.Add(new VidiunAPIException(error["code"].InnerText, error["message"].InnerText));
                else if (arrayNode["objectType"] != null)
                    multiResponse.Add(VidiunObjectFactory.Create(arrayNode, _MultiRequestReturnType[i]));
                else if (arrayNode["item"] != null)
                    multiResponse.Add(ParseMultiRequestResult(arrayNode, false));
                else
                    multiResponse.Add(arrayNode.InnerText);
                if (incrementI) 
                    i++;
            }
    
            return multiResponse;
        }
        
        public void MapMultiRequestParam(int resultNumber, int requestNumber, string requestParamName)
        {
            this.MapMultiRequestParam(resultNumber, null, requestNumber, requestParamName);
        }

        public void MapMultiRequestParam(int resultNumber, string resultParamName, int requestNumber, string requestParamName)
        {
            string resultParam = "{" + resultNumber + ":result";
            if (resultParamName != null && resultParamName != "")
                resultParam += resultParamName;
            resultParam += "}";

            string requestParam = requestNumber + ":" + requestParamName;

            _MultiRequestParamsMap.Add(requestParam, resultParam);
        }

        public string GenerateSession(string adminSecretForSigning)
        {
            return this.GenerateSession(adminSecretForSigning, "");
        }

        public string GenerateSession(string adminSecretForSigning, string userId)
        {
            return this.GenerateSession(adminSecretForSigning, userId, (VidiunSessionType)(0));
        }

        public string GenerateSession(string adminSecretForSigning, string userId, VidiunSessionType type)
        {
            return this.GenerateSession(adminSecretForSigning, userId, type, -1);
        }

        public string GenerateSession(string adminSecretForSigning, string userId, VidiunSessionType type, int partnerId)
        {
            return this.GenerateSession(adminSecretForSigning, userId, type, partnerId, 86400);
        }

        public string GenerateSession(string adminSecretForSigning, string userId, VidiunSessionType type, int partnerId, int expiry)
        {
            return this.GenerateSession(adminSecretForSigning, userId, type, partnerId, expiry, "");
        }

        public string GenerateSession(string adminSecretForSigning, string userId, VidiunSessionType type, int partnerId, int expiry, string privileges)
        {
            string vs = string.Format("{0};{0};{1};{2};{3};{4};{5};", partnerId, UnixTimeNow() + expiry, type.GetHashCode(), DateTime.Now.Ticks, userId, privileges);

            SHA1 sha = new SHA1CryptoServiceProvider();

            byte[] vsTextBytes = Encoding.ASCII.GetBytes(adminSecretForSigning + vs);

            byte[] sha1Bytes = sha.ComputeHash(vsTextBytes);

            string sha1Hex = "";
            foreach (char c in sha1Bytes)
                sha1Hex += string.Format("{0:x2}", (int)c);

            vs = sha1Hex.ToLower() + "|" + vs;

            return EncodeTo64(vs);
        }

        #endregion

        #region Private Helpers

        private void Log(string msg)
        {
            if (this._ShouldLog)
            {
                this._Config.Logger.Log(msg);
            }
        }

        private string Signature(VidiunParams vparams)
        {
            MD5CryptoServiceProvider md5 = new MD5CryptoServiceProvider();
            byte[] data = Encoding.ASCII.GetBytes(vparams.ToJson());
            data = md5.ComputeHash(data);
            StringBuilder sBuilder = new StringBuilder();
            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }
            return sBuilder.ToString();
        }

        private void ValidateXmlResult(XmlDocument doc)
        {
            XmlElement xml = doc["xml"];
            if (xml != null)
            {
                XmlElement result = xml["result"];
                if (result != null)
                {
                    return;
                }
            }

            throw new SerializationException("Invalid result");
        }

        private void ThrowExceptionOnAPIError(XmlElement result)
        {
            XmlElement error = result["error"];
            if (error != null && error["code"] != null && error["message"] != null)
            {
                resetRequest();
                throw new VidiunAPIException(error["code"].InnerText, error["message"].InnerText);
            }
        }

        private void PostMultiPartWithFiles(HttpWebRequest request, string json, VidiunFiles vfiles)
        {
            string boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            request.ContentType = "multipart/form-data; boundary=" + boundary;

            byte[] paramsBuffer = BuildMultiPartParamsBuffer(json, boundary);

            SortedList<string, MultiPartFileDescriptor> filesDescriptions = new SortedList<string, MultiPartFileDescriptor>();
            foreach (KeyValuePair<string, Stream> file in vfiles)
                filesDescriptions.Add(file.Key, BuildMultiPartFileDescriptor(file, boundary));

            // Set content's length
            request.ContentLength = paramsBuffer.LongLength;
            foreach (KeyValuePair<string, MultiPartFileDescriptor> fileDesc in filesDescriptions)
                request.ContentLength += fileDesc.Value.GetTotalLength();

            // And let's upload
            request.AllowWriteStreamBuffering = false; // A more sensible approach may be relevant
            Stream requestStream = request.GetRequestStream();
            requestStream.Write(paramsBuffer, 0, paramsBuffer.Length);
            foreach (KeyValuePair<string, MultiPartFileDescriptor> fileDesc in filesDescriptions)
            {
                requestStream.Write(fileDesc.Value._Header, 0, fileDesc.Value._Header.Length);

                byte[] buffer = new Byte[checked(Math.Min((uint)1048576, fileDesc.Value._Stream.Length))];
                int bytesRead = 0;
                while ((bytesRead = fileDesc.Value._Stream.Read(buffer, 0, buffer.Length)) != 0)
                    requestStream.Write(buffer, 0, bytesRead);

                requestStream.Write(fileDesc.Value._Footer, 0, fileDesc.Value._Footer.Length);
            }

            requestStream.Close();
        }

        /// <summary>
        /// Compiles the parameters required for PostMultiPartWithFiles(...) into a byte buffer ready to be streamed.
        /// </summary>
        /// <param name="vparams">The request's parameters.</param>
        /// <param name="boundary">The multipart's boundary.</param>
        /// <returns>
        /// The parameters' byte array ready to be streamed.
        /// </returns>
        private byte[] BuildMultiPartParamsBuffer(string json, string boundary)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("--" + boundary + "\r\n");
            sb.Append("Content-Disposition: form-data; name=\"json\"\r\n");
            sb.Append("\r\n");
            sb.Append(HttpUtility.UrlDecode(json));
            sb.Append("\r\n--" + boundary + "\r\n");

            return Encoding.UTF8.GetBytes(sb.ToString()); 
        }

        /// <summary>
        /// Pre-compiles the multipart data required for a given file.
        /// </summary>
        /// <param name="fileEntry">The provided file infos.</param>
        /// <param name="boundary">The multipart's boundary.</param>
        /// <returns>
        /// A description containing the file's stream and the part's header and footer.
        /// </returns>
        private MultiPartFileDescriptor BuildMultiPartFileDescriptor(KeyValuePair<string, Stream> fileEntry, string boundary)
        {
            MultiPartFileDescriptor result = new MultiPartFileDescriptor();
            result._Stream = fileEntry.Value;

            // Build header
            StringBuilder sb = new StringBuilder();
            Stream fileStream = fileEntry.Value;
            if(fileStream is FileStream)
            {
                FileStream fs = (FileStream)fileStream;
                sb.Append("Content-Disposition: form-data; name=\"" + fileEntry.Key + "\"; filename=\"" + Path.GetFileName(fs.Name) + "\"" + "\r\n");
            }
            else if(fileStream is MemoryStream)
            {
                sb.Append("Content-Disposition: form-data; name=\"" + fileEntry.Key + "\"; filename=\"Memory-Stream-Upload\"" + "\r\n");
            }
            sb.Append("Content-Type: application/octet-stream" + "\r\n");
            sb.Append("\r\n");
            result._Header = Encoding.UTF8.GetBytes(sb.ToString());

            result._Footer = Encoding.UTF8.GetBytes("\r\n--" + boundary + "\r\n");

            return result;
        }

        private void PostUrlEncodedParams(HttpWebRequest request, string json)
        {
            byte[] buffer;
            buffer = System.Text.Encoding.UTF8.GetBytes(json);
            request.ContentType = "application/json";
            request.ContentLength = System.Text.Encoding.UTF8.GetBytes(json).Length;
            Stream requestStream = request.GetRequestStream();
            requestStream.Write(buffer, 0, buffer.Length);
            requestStream.Close();
        }

        public long UnixTimeNow()
        {
            TimeSpan _TimeSpan = (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0));
            return (long)_TimeSpan.TotalSeconds;
        }

        private string EncodeTo64(string toEncode)
        {
            byte[] toEncodeAsBytes = System.Text.ASCIIEncoding.ASCII.GetBytes(toEncode);
            string returnValue = System.Convert.ToBase64String(toEncodeAsBytes);
            return returnValue;
        }

        protected void resetRequest()
        {
            if (IsMultiRequest)
            {
                _MultiRequestReturnType.Clear();
                _MultiRequestReturnType = null;
            }

            _CallsQueue.Clear();
            _MultiRequestParamsMap.Clear();
        }

        #endregion

        #region Support Types

        private struct MultiPartFileDescriptor
        {
            public Stream _Stream;
            public byte[] _Header;
            public byte[] _Footer;

            public long GetTotalLength()
            {
                return _Stream.Length + _Header.LongLength + _Footer.LongLength;
            }
        }

        #endregion
    }
}

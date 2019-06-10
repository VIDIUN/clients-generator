using System;
using System.Collections.Generic;
using System.Text;
using System.Xml;

namespace Vidiun.Request
{
    abstract public class RequestBuilder<T> : BaseRequestBuilder<T>, IRequestBuilder
    {
        private string action;

        public int MultiRequestIndex
        {
            set;
            get;
        }

        public RequestBuilder(string service, string action) : base(service)
        {
            this.action = action;
        }

        public override MultiRequestBuilder Add(IRequestBuilder requestBuilder) 
        {
            return new MultiRequestBuilder(this, requestBuilder);
        }

        public void OnComplete(object response, APIException error)
        {
            base.OnComplete((T)response, error);
        }

        protected override string getPath()
        {
            return base.getPath() + "/action/" + action;
        }

        public override Params getParameters(bool includeServiceAndAction)
        {
            Params vparams = base.getParameters(includeServiceAndAction);

            if (includeServiceAndAction)
                vparams.Add("action", action);

            return vparams;
        }

        public new RequestBuilder<T> Map(string key, MultiRequestToken token)
        {
            if (multiRequestMappings == null)
            {
                multiRequestMappings = new Dictionary<string, MultiRequestToken>();
            }

            multiRequestMappings.Add(key, token);

            return this;
        }

        protected bool isMapped(string key)
        {
            return multiRequestMappings != null && multiRequestMappings.ContainsKey(key);
        }

        public MultiRequestToken Forward(string path = "")
        {
            return new MultiRequestToken(this, path);
        }
    }
}

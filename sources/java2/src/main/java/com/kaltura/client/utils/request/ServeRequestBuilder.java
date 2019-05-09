package com.vidiun.client.utils.request;

import com.vidiun.client.Client;
import com.vidiun.client.Params;
import com.vidiun.client.types.APIException;
import com.vidiun.client.utils.APIConstants;

public abstract class ServeRequestBuilder extends RequestBuilder<String, String, ServeRequestBuilder> {

    public ServeRequestBuilder(String service, String action) {
        super(String.class, service, action);
    }

	@Override
    public String getMethod() {
    	return "GET";
    }

    @Override
    public String getBody() {
        return null;
    }

	@Override
    public RequestElement<String> build(final Client client, boolean addSignature) {
		Params vParams = prepareParams(client, true);
		prepareHeaders(client.getConnectionConfiguration());
		String endPoint = client.getConnectionConfiguration().getEndpoint().replaceAll("/$", "");
        StringBuilder urlBuilder = new StringBuilder(endPoint)
        .append("/")
        .append(APIConstants.UrlApiVersion)
        .append("/service/")
        .append(service)
        .append("/action/")
        .append(action)
        .append("?")
        .append(vParams.toQueryString());
        
        url = urlBuilder.toString();
		
		return this;
    }
	
	@Override
    protected Object parse(String response) throws APIException {
    	return response;
    }

	@Override
	public String getTokenizer() throws APIException {
		throw new APIException(APIException.FailureStep.OnRequest, "Served content response can not be used as multi-request token");
	}
	
	@Override
    public MultiRequestBuilder add(RequestBuilder<?, ?, ?> another) throws APIException {
    	throw new APIException("Multi-request is not supported on serve actions"); 
    }
}















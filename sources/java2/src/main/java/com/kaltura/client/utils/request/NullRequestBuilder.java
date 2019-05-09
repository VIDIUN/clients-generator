package com.vidiun.client.utils.request;

import com.vidiun.client.types.APIException;
import com.vidiun.client.utils.response.base.Response;

public abstract class NullRequestBuilder extends RequestBuilder<Void, Void, NullRequestBuilder> {

    public NullRequestBuilder(String service, String action) {
        super(Void.class, service, action);
    }

    @Override
    public void onComplete(Response<Void> response) {
        super.onComplete(response.results(null));
    }

	@Override
	public Void getTokenizer() throws APIException {
		throw new APIException(APIException.FailureStep.OnRequest, "Null response can not be used as multi-request token");
	}
}

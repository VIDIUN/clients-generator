package com.vidiun.client;

import com.vidiun.client.utils.request.ConnectionConfiguration;
import com.vidiun.client.utils.request.RequestElement;
import com.vidiun.client.utils.response.base.Response;

public interface RequestQueue {

    void setDefaultConfiguration(ConnectionConfiguration config);

    @SuppressWarnings("rawtypes")
	String queue(RequestElement request);

    @SuppressWarnings("rawtypes")
	Response<?> execute(RequestElement request);

    void cancelRequest(String reqId);

    void clearRequests();

    boolean isEmpty();

    void enableLogs(boolean enable);

    void enableLogResponseHeader(String header, boolean log);
}

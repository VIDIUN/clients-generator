package com.vidiun.client.utils.request;


import com.vidiun.client.Files;
import com.vidiun.client.utils.response.base.Response;
import com.vidiun.client.utils.response.base.ResponseElement;

import java.util.HashMap;


public interface RequestElement<T> {

    String getContentType();

    String getMethod();

    String getUrl();

    String getBody();

    String getTag();

    Files getFiles();

    HashMap<String, String> getHeaders();

    ConnectionConfiguration config();

    Response<T> parseResponse(ResponseElement responseElement);

    void onComplete(Response<T> response);
}

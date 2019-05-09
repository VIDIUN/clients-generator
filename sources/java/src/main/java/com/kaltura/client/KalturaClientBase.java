// ===================================================================================================
//						   _  __	 _ _
//						  | |/ /__ _| | |_ _  _ _ _ __ _
//						  | ' </ _` | |  _| || | '_/ _` |
//						  |_|\_\__,_|_|\__|\_,_|_| \__,_|
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
package com.vidiun.client;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.net.SocketTimeoutException;
import java.net.URLEncoder;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Random;
import java.util.zip.GZIPInputStream;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.xpath.XPathExpressionException;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.httpclient.ConnectTimeoutException;
import org.apache.commons.httpclient.DefaultHttpMethodRetryHandler;
import org.apache.commons.httpclient.Header;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpConnectionManager;
import org.apache.commons.httpclient.HttpException;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.httpclient.MultiThreadedHttpConnectionManager;
import org.apache.commons.httpclient.ProxyHost;
import org.apache.commons.httpclient.SimpleHttpConnectionManager;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.commons.httpclient.methods.multipart.FilePart;
import org.apache.commons.httpclient.methods.multipart.MultipartRequestEntity;
import org.apache.commons.httpclient.methods.multipart.Part;
import org.apache.commons.httpclient.methods.multipart.PartSource;
import org.apache.commons.httpclient.methods.multipart.StringPart;
import org.apache.commons.httpclient.params.HttpConnectionManagerParams;
import org.apache.commons.httpclient.params.HttpMethodParams;
import org.w3c.dom.Element;

import com.vidiun.client.enums.VidiunSessionType;
import com.vidiun.client.utils.ParseUtils;
import com.vidiun.client.utils.XmlUtils;

/**
 * Contains non-generated client logic. Includes the doQueue method which is responsible for
 * making HTTP calls to the Vidiun server.
 * 
 * @author jpotts
 *
 */
@SuppressWarnings("serial")
abstract public class VidiunClientBase implements Serializable {
	
	private static final String UTF8_CHARSET = "UTF-8";

    // VS v2 constants
    private static final int BLOCK_SIZE = 16;
    private static final String FIELD_EXPIRY = "_e";
    private static final String FIELD_USER = "_u";
	private static final String FIELD_TYPE = "_t";
	private static final int RANDOM_SIZE = 16; 

	private static final int MAX_DEBUG_RESPONSE_STRING_LENGTH = 1024;
	protected VidiunConfiguration vidiunConfiguration;
    protected List<VidiunServiceActionCall> callsQueue;
    protected List<Class<?>> requestReturnType;
    protected VidiunParams multiRequestParamsMap;
	protected Map<String, Object> clientConfiguration = new HashMap<String, Object>();
	protected Map<String, Object> requestConfiguration = new HashMap<String, Object>();

	private static IVidiunLogger logger = VidiunLogger.getLogger(VidiunClientBase.class);
    
    private Header[] responseHeaders = null; 
    
    private boolean acceptGzipEncoding = true;
    
    protected static final String HTTP_HEADER_ACCEPT_ENCODING = "Accept-Encoding";

	protected static final String HTTP_HEADER_CONTENT_ENCODING = "Content-Encoding";

	protected static final String ENCODING_GZIP = "gzip";
    /**
	 * Set whether to accept GZIP encoding, that is, whether to
	 * send the HTTP "Accept-Encoding" header with "gzip" as value.
	 * <p>Default is "true". Turn this flag off if you do not want
	 * GZIP response compression even if enabled on the HTTP server.
	 */
	public void setAcceptGzipEncoding(boolean acceptGzipEncoding) {
		this.acceptGzipEncoding = acceptGzipEncoding;
	}
    /**
	 * Return whether to accept GZIP encoding, that is, whether to
	 * send the HTTP "Accept-Encoding" header with "gzip" as value.
	 */
	public boolean isAcceptGzipEncoding() {
		return acceptGzipEncoding;
	}
    
    /**
	 * Determine whether the given response is a GZIP response.
	 * <p>Default implementation checks whether the HTTP "Content-Encoding"
	 * header contains "gzip" (in any casing).
	 * @param postMethod the PostMethod to check
	 */
	protected boolean isGzipResponse(PostMethod postMethod) {
		Header encodingHeader = postMethod.getResponseHeader(HTTP_HEADER_CONTENT_ENCODING);
		if (encodingHeader == null || encodingHeader.getValue() == null) {
			return false;
		}
		return (encodingHeader.getValue().toLowerCase().indexOf(ENCODING_GZIP) != -1);
	}
    
    /**
	 * Extract the response body from the given executed remote invocation
	 * request.
	 * <p>The default implementation simply fetches the PostMethod's response
	 * body stream. If the response is recognized as GZIP response, the
	 * InputStream will get wrapped in a GZIPInputStream.
	 * @param config the HTTP invoker configuration that specifies the target service
	 * @param postMethod the PostMethod to read the response body from
	 * @return an InputStream for the response body
	 * @throws IOException if thrown by I/O methods
	 * @see #isGzipResponse
	 * @see java.util.zip.GZIPInputStream
	 * @see org.apache.commons.httpclient.methods.PostMethod#getResponseBodyAsStream()
	 * @see org.apache.commons.httpclient.methods.PostMethod#getResponseHeader(String)
	 */
	protected InputStream getResponseBody(PostMethod postMethod)
			throws IOException {

		if (isGzipResponse(postMethod)) {
			return new GZIPInputStream(postMethod.getResponseBodyAsStream());
		}
		else {
			return postMethod.getResponseBodyAsStream();
		}
	}
    
    public Header[] getResponseHeaders()
    {
        return responseHeaders;
    }

    public VidiunClientBase() {
    }

    public VidiunClientBase(VidiunConfiguration config) {
        this.vidiunConfiguration = config;
        this.callsQueue = new ArrayList<VidiunServiceActionCall>();
        this.multiRequestParamsMap = new VidiunParams();
    }

	public boolean isMultiRequest() {
		return (requestReturnType != null);
	}

	public void setVidiunConfiguration(VidiunConfiguration vidiunConfiguration) {
		this.vidiunConfiguration = vidiunConfiguration;
	}

	public VidiunConfiguration getVidiunConfiguration() {
		return this.vidiunConfiguration;
	}
	
	public void queueServiceCall(String service, String action, VidiunParams vparams) throws VidiunApiException {
		this.queueServiceCall(service, action, vparams, new VidiunFiles(), null);
	}
	
	public void queueServiceCall(String service, String action, VidiunParams vparams, Class<?> expectedClass) throws VidiunApiException {
		this.queueServiceCall(service, action, vparams, new VidiunFiles(), expectedClass);
	}
	
	public void queueServiceCall(String service, String action, VidiunParams vparams, VidiunFiles vfiles) throws VidiunApiException {
		this.queueServiceCall(service, action, vparams, vfiles, null);
	}

	public void queueServiceCall(String service, String action, VidiunParams vparams, VidiunFiles vfiles, Class<?> expectedClass) throws VidiunApiException {
		Object value;
		for(Entry<String, Object> itr : this.requestConfiguration.entrySet()) {
			value = itr.getValue();
			if(value instanceof VidiunObjectBase){
				vparams.add(itr.getKey(), (VidiunObjectBase)value);
			}
			else{				
				vparams.add(itr.getKey(), String.valueOf(value));
			}
		}

		VidiunServiceActionCall call = new VidiunServiceActionCall(service, action, vparams, vfiles);
		if(requestReturnType != null)
			requestReturnType.add(expectedClass);
		this.callsQueue.add(call);
	}
	
	public String serve() throws VidiunApiException {
		
		VidiunParams vParams = new VidiunParams();
		String url = extractParamsFromCallQueue(vParams, new VidiunFiles());
		String vParamsString = vParams.toQueryString();
		url += "?" + vParamsString;
		
		return url;
	}
	
	abstract protected void resetRequest();

	public Element doQueue() throws VidiunApiException {
		if (this.callsQueue.isEmpty()) return null;

		if (logger.isEnabled())
			logger.debug("service url: [" + this.vidiunConfiguration.getEndpoint() + "]");

		VidiunParams vparams = new VidiunParams();
		VidiunFiles vfiles = new VidiunFiles();

		String url = extractParamsFromCallQueue(vparams, vfiles);

		if (logger.isEnabled())
		{
			logger.debug("JSON: [" + vparams + "]");
		}

		PostMethod method;
		try {
			method = createPostMethod(vparams, vfiles, url);
		} catch (UnsupportedEncodingException e) {
			resetRequest();
			throw new VidiunApiException("Unsupported encoding: " + e.getMessage());
		}
		
		HttpClient client = createHttpClient();
		String responseString = null;
		try {
			responseString = executeMethod(client, method);
		} finally {
			resetRequest();
		}
		
		Element responseXml = XmlUtils.parseXml(responseString);
		Element resultXml = this.validateXmlResult(responseXml);
		this.throwExceptionOnAPIError(resultXml);
				
		return resultXml;
	}

    protected String readRemoteInvocationResult(InputStream is)
    	throws IOException {
    
        try {
    	  return doReadRemoteInvocationResult(is);
        }
        finally {
    	  is.close();
        }
    }

    protected String doReadRemoteInvocationResult(InputStream is)
    	throws IOException {
    
        byte[] buf = new byte[1024];
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int len;
        while ( (len = is.read(buf)) > 0)
        {
        	out.write(buf,0,len);
        }
        return new String(out.toByteArray(), UTF8_CHARSET);
    }

	protected String executeMethod(HttpClient client, PostMethod method) throws VidiunApiException {
		String responseString = "";
		try {
			// Execute the method.
			int statusCode = client.executeMethod(method);

			if (logger.isEnabled())
			{
				Header[] headers = method.getRequestHeaders();
				for(Header header : headers)
					logger.debug("Header [" + header.getName() + " value [" + header.getValue() + "]");
			}
			
			if (logger.isEnabled() && statusCode != HttpStatus.SC_OK) {
				logger.error("Method failed: " + method.getStatusLine ( ));
				throw new VidiunApiException("Unexpected Http return code: " + statusCode);
			}

			// Read the response body
            InputStream responseBodyIS = null;
            if (isGzipResponse(method)) {
                responseBodyIS = new GZIPInputStream(method.getResponseBodyAsStream());
                if (logger.isEnabled()) logger.debug("Using gzip compression to handle response for: "+method.getName()+" "+method.getPath()+"?"+method.getQueryString());
            } else {
                responseBodyIS = method.getResponseBodyAsStream();
                if (logger.isEnabled()) logger.debug("No gzip compression for this response");
            }
            String responseBody = readRemoteInvocationResult(responseBodyIS);
            responseHeaders = method.getResponseHeaders();
            
            // print server debug info
            String serverName = null;
            String serverSession = null;
            for(Header header : responseHeaders)
            {
            	if (header.getName().compareTo("X-Me") == 0)
                    serverName = header.getValue();
            	else if (header.getName().compareTo("X-Vidiun-Session") == 0)
                    serverSession = header.getValue();
			}
			if (serverName != null || serverSession != null)
				logger.debug("Server: [" + serverName + "], Session: [" + serverSession + "]");

			// Deal with the response.
			// Use caution: ensure correct character encoding and is not binary data
			responseString = new String (responseBody.getBytes(UTF8_CHARSET), UTF8_CHARSET); // Unicon: this MUST be set to UTF-8 charset -AZ
			if (logger.isEnabled())
			{
				if(responseString.length() < MAX_DEBUG_RESPONSE_STRING_LENGTH) {
					logger.debug(responseString);
				} else {
					logger.debug("Received long response. (length : " + responseString.length() + ")");
				}
			}
			
			return responseString;
			
		} catch ( HttpException e ) {
			if (logger.isEnabled())
				logger.error( "Fatal protocol violation: " + e.getMessage ( ) ,e);
			throw new VidiunApiException("Protocol exception occured while executing request");
		} catch ( SocketTimeoutException e) {
			if (logger.isEnabled())
				logger.error( "Fatal transport error: " + e.getMessage ( ), e);
			throw new VidiunApiException("Request was timed out");
		} catch ( ConnectTimeoutException e) {
			if (logger.isEnabled())
				logger.error( "Fatal transport error: " + e.getMessage ( ), e);
			throw new VidiunApiException("Connection to server was timed out");
		} catch ( IOException e ) {
			if (logger.isEnabled())
				logger.error( "Fatal transport error: " + e.getMessage ( ), e);
			throw new VidiunApiException("I/O exception occured while reading request response");
		}  finally {
			// Release the connection.
			method.releaseConnection ( );
		}
	}

	private PostMethod createPostMethod(VidiunParams vparams, VidiunFiles vfiles, String url) throws UnsupportedEncodingException {
		PostMethod method = new PostMethod(url);
        method.setRequestHeader("Accept","text/xml,application/xml,*/*");
        method.setRequestHeader("Accept-Charset","utf-8,ISO-8859-1;q=0.7,*;q=0.5");
        
        if (!vfiles.isEmpty()) {        	
            method = this.getPostMultiPartWithFiles(method, vparams, vfiles);        	
        } else {
            method = this.addParams(method, vparams);            
        }
        
        if (isAcceptGzipEncoding()) {
			method.addRequestHeader(HTTP_HEADER_ACCEPT_ENCODING, ENCODING_GZIP);
		}

		// Provide custom retry handler is necessary
		method.getParams().setParameter(HttpMethodParams.RETRY_HANDLER, new DefaultHttpMethodRetryHandler (3, false));
		return method;
	}

	protected HttpClient createHttpClient() {
		HttpClient client = new HttpClient();

		// added by Unicon to handle proxy hosts
		String proxyHost = System.getProperty( "http.proxyHost" );
		if ( proxyHost != null ) {
			int proxyPort = -1;
			String proxyPortStr = System.getProperty( "http.proxyPort" );
			if (proxyPortStr != null) {
				try {
					proxyPort = Integer.parseInt( proxyPortStr );
				} catch (NumberFormatException e) {
					if (logger.isEnabled())
						logger.warn("Invalid number for system property http.proxyPort ("+proxyPortStr+"), using default port instead");
				}
			}
			ProxyHost proxy = new ProxyHost( proxyHost, proxyPort );
			client.getHostConfiguration().setProxyHost( proxy );
		}		
		// added by Unicon to force encoding to UTF-8
		client.getParams().setParameter(HttpMethodParams.HTTP_CONTENT_CHARSET, UTF8_CHARSET);
		client.getParams().setParameter(HttpMethodParams.HTTP_ELEMENT_CHARSET, UTF8_CHARSET);
		client.getParams().setParameter(HttpMethodParams.HTTP_URI_CHARSET, UTF8_CHARSET);
		
		HttpConnectionManagerParams connParams = client.getHttpConnectionManager().getParams();
		if(this.vidiunConfiguration.getTimeout() != 0) {
			connParams.setSoTimeout(this.vidiunConfiguration.getTimeout());
			connParams.setConnectionTimeout(this.vidiunConfiguration.getTimeout());
		}
		client.getHttpConnectionManager().setParams(connParams);
		return client;
	}
	
	/**
	 * We need to make sure that we shut down the connection.
	 * The possible connection manager types are taken from here:
	 * http://hc.apache.org/httpclient-legacy/apidocs/org/apache/commons/httpclient/HttpConnectionManager.html
	 * 
	 * The issue details is described here:
	 * http://fuyun.org/2009/09/connection-close-in-httpclient/
	 * 
	 * @param client The client we wish to close
	 */
	protected void closeHttpClient(HttpClient client) {
		HttpConnectionManager mgr = client.getHttpConnectionManager();
		
		if (mgr instanceof SimpleHttpConnectionManager) {
		    ((SimpleHttpConnectionManager)mgr).shutdown();
		}
		
		if(mgr instanceof MultiThreadedHttpConnectionManager) {
			((MultiThreadedHttpConnectionManager)mgr).shutdown();
		}
	}

	private String extractParamsFromCallQueue(VidiunParams vparams, VidiunFiles vfiles) throws VidiunApiException {
		
		String url = this.vidiunConfiguration.getEndpoint() + "/api_v3";
		
		// append the basic params
		vparams.add("format", this.vidiunConfiguration.getServiceFormat());
		vparams.add("ignoreNull", true);
	
		Object value;
		for(Entry<String, Object> itr : this.clientConfiguration.entrySet()) {
			value = itr.getValue();
			if(value instanceof VidiunObjectBase){
				vparams.add(itr.getKey(), (VidiunObjectBase)value);
			}
			else{				
				vparams.add(itr.getKey(), String.valueOf(value));
			}
		}
		
		if (requestReturnType != null) {
			url += "/service/multirequest";
			int i = 1;
			for (VidiunServiceActionCall call : this.callsQueue) {
				VidiunParams callParams = call.getParamsForMultiRequest(i);
				vparams.add(callParams);
				VidiunFiles callFiles = call.getFilesForMultiRequest(i);
				vfiles.add(callFiles);
				i++;
			}

			// map params
			for (Object key : this.multiRequestParamsMap.keySet()) {
				String requestParam = (String) key;
				VidiunParams resultParam = this.multiRequestParamsMap.getParams(requestParam);

				if (vparams.containsKey(requestParam)) {
					vparams.add(requestParam, resultParam);
				}
			}
			
			// Clean
			this.multiRequestParamsMap.clear();
			
		} else {
			VidiunServiceActionCall call = this.callsQueue.get(0);
			url += "/service/" + call.getService() + "/action/" + call.getAction();
			vparams.add(call.getParams());
			vfiles.add(call.getFiles());
		}
		
		// cleanup
		this.callsQueue.clear();
		
		vparams.add("vidsig", this.signature(vparams));
		return url;
	}

	public void startMultiRequest() {
		requestReturnType = new ArrayList<Class<?>>();
	}

	public Element getElementByXPath(Element element, String xPath) throws VidiunApiException
	{
		try 
		{
			return XmlUtils.getElementByXPath(element, xPath);
		}
		catch (XPathExpressionException xee)
		{
			throw new VidiunApiException("XPath expression exception evaluating result");
		}
	}
	
	public VidiunMultiResponse doMultiRequest() throws VidiunApiException
	{
		Element multiRequestResult = doQueue();

		VidiunMultiResponse multiResponse = new VidiunMultiResponse();
	   
		for(int i = 0; i < multiRequestResult.getChildNodes().getLength(); i++) 
		{
			Element arrayNode = (Element)multiRequestResult.getChildNodes().item(i);
			
			try
			{
				VidiunApiException exception = getExceptionOnAPIError(arrayNode);
				if (exception != null)
				{
					multiResponse.add(exception);
				}	
				else if (getElementByXPath(arrayNode, "objectType") != null)
				{
			   		multiResponse.add(VidiunObjectFactory.create(arrayNode, requestReturnType.get(i)));
				}
				else if (getElementByXPath(arrayNode, "item/objectType") != null)
				{
			   		multiResponse.add(ParseUtils.parseArray(requestReturnType.get(i), arrayNode));
				}
				else
				{
					multiResponse.add(arrayNode.getTextContent());
				}
			}
			catch (VidiunApiException e)
			{
				multiResponse.add(e);
			}
	   }
		
		// Cleanup
		this.requestReturnType = null;
		return multiResponse;
	}
	
	
	public void mapMultiRequestParam(int resultNumber, int requestNumber, String requestParamName) throws VidiunApiException {
		this.mapMultiRequestParam(resultNumber, null, requestNumber, requestParamName);
	}

	public void mapMultiRequestParam(int resultNumber, String resultParamName, int requestNumber, String requestParamName) throws VidiunApiException {
		String resultParam = "{" + resultNumber + ":result";
		if (resultParamName != null && resultParamName != ""){
			resultParam += resultParamName;
		}
		resultParam += "}";

		String requestNumberString = Integer.toString(requestNumber);
		VidiunParams params = new VidiunParams();
		params.add(requestParamName, resultParam);
		this.multiRequestParamsMap.add(requestNumberString, params);
	}

	private String signature(VidiunParams vparams) throws VidiunApiException {
		String md5 = new String(Hex.encodeHex(DigestUtils.md5(vparams.toString())));;
		return md5;
	}

	private Element validateXmlResult(Element resultXml) throws VidiunApiException {
		
		Element resultElement = null;
   		resultElement = getElementByXPath(resultXml, "/xml/result");
						
		if (resultElement != null) {
			return resultElement;			
		} else {
			throw new VidiunApiException("Invalid result");
		}
	}

	private VidiunApiException getExceptionOnAPIError(Element result) throws VidiunApiException {
		Element errorElement = getElementByXPath(result, "error");
		if (errorElement == null)
		{
			return null;
		}
		
		Element messageElement = getElementByXPath(errorElement, "message");
		Element codeElement = getElementByXPath(errorElement, "code");
		if (messageElement == null || codeElement == null)
		{
			return null;
		}
		
		return new VidiunApiException(messageElement.getTextContent(),codeElement.getTextContent());
	}

	private void throwExceptionOnAPIError(Element result) throws VidiunApiException {
		VidiunApiException exception = getExceptionOnAPIError(result);
		if (exception != null)
		{
			throw exception;
		}
	}

	private PostMethod getPostMultiPartWithFiles(PostMethod method, VidiunParams vparams, VidiunFiles vfiles) {
 
		String boundary = "---------------------------" + System.currentTimeMillis();
		List <Part> parts = new ArrayList<Part>();
		parts.add(new StringPart (HttpMethodParams.MULTIPART_BOUNDARY, boundary));
 
		parts.add(new StringPart ("json", vparams.toString()));	   

		for (String key : vfiles.keySet()) {
			final VidiunFile vFile = vfiles.get(key);
			parts.add(new StringPart(key, "filename=" + vFile.getName()));
			if (vFile.getFile() != null) {
				// use the file
				File file = vFile.getFile();
				try {
					parts.add(new FilePart(key, file));
				} catch (FileNotFoundException e) {
					// TODO this sort of leaves the submission in a weird
					// state... -AZ
					if (logger.isEnabled())
						logger.error("Exception while iterating over vfiles", e);
				}
			} else {
				// use the input stream
				PartSource fisPS = new PartSource() {
					public long getLength() {
						return vFile.getSize();
					}

					public String getFileName() {
						return vFile.getName();
					}

					public InputStream createInputStream() throws IOException {
						return vFile.getInputStream();
					}
				};
				parts.add(new FilePart(key, fisPS));
			}
		}
	 
		Part allParts[] = new Part[parts.size()];
		allParts = parts.toArray(allParts);
	 
		method.setRequestEntity(new MultipartRequestEntity(allParts, method.getParams()));

		// Ensures that request negotiation happens before the body is sent (preventing issues around uploads over HTTPS being rejected)
		method.getParams().setBooleanParameter(HttpMethodParams.USE_EXPECT_CONTINUE, true);
 
		return method;
	}
		
	private PostMethod addParams(PostMethod method, VidiunParams vparams) throws UnsupportedEncodingException {
		String content = vparams.toString();
		String contentType = "application/json";
		StringRequestEntity requestEntity = new StringRequestEntity(content, contentType , null);
		
		method.setRequestEntity(requestEntity);
		return method;
	}
	
	public String generateSession(String adminSecretForSigning, String userId, VidiunSessionType type, int partnerId) throws Exception
	{
		return this.generateSession(adminSecretForSigning, userId, type, partnerId, 86400);
	}
	
	public String generateSession(String adminSecretForSigning, String userId, VidiunSessionType type, int partnerId, int expiry) throws Exception
	{
		return this.generateSession(adminSecretForSigning, userId, type, partnerId, expiry, "");
	}

	public String generateSession(String adminSecretForSigning, String userId, VidiunSessionType type, int partnerId, int expiry, String privileges) throws Exception
	{
		try
		{
			// initialize required values
			int rand = (int)(Math.random() * 32000);
			expiry += (int)(System.currentTimeMillis() / 1000);
			
			// build info string
			StringBuilder sbInfo = new StringBuilder();
			sbInfo.append(partnerId).append(";"); // index 0 - partner ID
			sbInfo.append(partnerId).append(";"); // index 1 - partner pattern - using partner ID
			sbInfo.append(expiry).append(";"); // index 2 - expiration timestamp
			sbInfo.append(type.getHashCode()).append(";"); // index 3 - session type
			sbInfo.append(rand).append(";"); // index 4 - random number
			sbInfo.append(userId).append(";"); // index 5 - user ID
			sbInfo.append(privileges); // index 6 - privileges
			
			byte[] infoSignature = signInfoWithSHA1(adminSecretForSigning + (sbInfo.toString()));
			
			// convert signature to hex:
			String signature = this.convertToHex(infoSignature);
			
			// build final string to base64 encode
			StringBuilder sbToEncode = new StringBuilder();
			sbToEncode.append(signature.toString()).append("|").append(sbInfo.toString());
			
			// encode the signature and info with base64
			String hashedString = new String(Base64.encodeBase64(sbToEncode.toString().getBytes()));
			
			// remove line breaks in the session string
			String vs = hashedString.replace("\n", "");
			vs = hashedString.replace("\r", "");
			
			// return the generated session key (VS)
			return vs;
		} catch (NoSuchAlgorithmException ex)
		{
			throw new Exception(ex);
		}
	}

	public String generateSessionV2(String adminSecretForSigning, String userId, VidiunSessionType type, int partnerId, int expiry, String privileges) throws Exception
	{
		try {
		// build fields array
		VidiunParams fields = new VidiunParams();
		String[] privilegesArr = privileges.split(",");
		for (String curPriv : privilegesArr) {
			String privilege = curPriv.trim();
			if(privilege.length() == 0)
				continue;
			if(privilege.equals("*"))
				privilege = "all:*";
			
			String[] splittedPriv = privilege.split(":");
			if(splittedPriv.length>1) {
				fields.add(splittedPriv[0], URLEncoder.encode(splittedPriv[1], UTF8_CHARSET));
			} else {
				fields.add(splittedPriv[0], "");
			}
		}
		
		Integer expiryInt = (int)(System.currentTimeMillis() / 1000) + expiry;
		String expStr = expiryInt.toString();
		fields.add(FIELD_EXPIRY,  expStr);
		fields.add(FIELD_TYPE, Integer.toString(type.getHashCode()));
		fields.add(FIELD_USER, userId);
		
		// build fields string
		byte[] randomBytes = createRandomByteArray(RANDOM_SIZE);
		byte[] fieldsByteArray = fields.toQueryString().getBytes();
		int totalLength = randomBytes.length + fieldsByteArray.length;
		byte[] fieldsAndRandomBytes = new byte[totalLength];
		System.arraycopy(randomBytes, 0, fieldsAndRandomBytes, 0, randomBytes.length);
		System.arraycopy(fieldsByteArray, 0, fieldsAndRandomBytes, randomBytes.length, fieldsByteArray.length);

		byte[] infoSignature = signInfoWithSHA1(fieldsAndRandomBytes);
		byte[] input = new byte[infoSignature.length + fieldsAndRandomBytes.length];
		System.arraycopy(infoSignature, 0, input, 0, infoSignature.length);
		System.arraycopy(fieldsAndRandomBytes,0,input,infoSignature.length, fieldsAndRandomBytes.length);
		
		// encrypt and encode
		byte[] encryptedFields = aesEncrypt(adminSecretForSigning, input);
		String prefix = "v2|" + partnerId + "|";
		
		byte[] output = new byte[encryptedFields.length + prefix.length()];
		System.arraycopy(prefix.getBytes(), 0, output, 0, prefix.length());
		System.arraycopy(encryptedFields,0,output,prefix.length(), encryptedFields.length);
		
		String encodedVs = new String(Base64.encodeBase64(output));
		encodedVs = encodedVs.replaceAll("\\+", "-");
		encodedVs = encodedVs.replaceAll("/", "_");
		encodedVs = encodedVs.replace("\n", "");
		encodedVs = encodedVs.replace("\r", "");
		
		return encodedVs;
		} catch (GeneralSecurityException ex) {
			logger.error("Failed to generate v2 session.");
			throw new Exception(ex);
		} 
	}
	
	private byte[] signInfoWithSHA1(String text) throws GeneralSecurityException {
		return signInfoWithSHA1(text.getBytes());
	}
	
	private byte[] signInfoWithSHA1(byte[] data) throws GeneralSecurityException {
		MessageDigest algorithm = MessageDigest.getInstance("SHA1");
		algorithm.reset();
		algorithm.update(data);
		byte infoSignature[] = algorithm.digest();
		return infoSignature;
	}
	
	private byte[] aesEncrypt(String secretForSigning, byte[] text) throws GeneralSecurityException, UnsupportedEncodingException {
		// Key
		byte[] hashedKey = signInfoWithSHA1(secretForSigning);
		byte[] keyBytes = new byte[BLOCK_SIZE];
		System.arraycopy(hashedKey,0,keyBytes,0,BLOCK_SIZE);
		SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");
		
		// IV
		byte[] ivBytes = new byte[BLOCK_SIZE];
		IvParameterSpec iv = new IvParameterSpec(ivBytes);
		
		// Text
		int textSize = ((text.length + BLOCK_SIZE - 1) / BLOCK_SIZE) * BLOCK_SIZE;
		byte[] textAsBytes = new byte[textSize];
		Arrays.fill(textAsBytes, (byte)0);
		System.arraycopy(text, 0, textAsBytes, 0, text.length);
		
		// Encrypt
		Cipher cipher = Cipher.getInstance("AES/CBC/NOPADDING");
	    cipher.init(Cipher.ENCRYPT_MODE, key, iv);
        return cipher.doFinal(textAsBytes);
	}
	
	
	private byte[] createRandomByteArray(int size)	{
		byte[] b = new byte[size];
		new Random().nextBytes(b);
		return b;
	}

	// new function to convert byte array to Hex
	private String convertToHex(byte[] data) { 
		StringBuffer buf = new StringBuffer();
		for (int i = 0; i < data.length; i++) { 
			int halfbyte = (data[i] >>> 4) & 0x0F;
			int two_halfs = 0;
			do { 
				if ((0 <= halfbyte) && (halfbyte <= 9)) 
					buf.append((char) ('0' + halfbyte));
				else 
					buf.append((char) ('a' + (halfbyte - 10)));
				halfbyte = data[i] & 0x0F;
			} while(two_halfs++ < 1);
		} 
		return buf.toString();
	} 
	
}

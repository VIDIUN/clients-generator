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
package com.vidiun.client.test;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.PostMethod;
import org.w3c.dom.Element;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.VidiunConfiguration;
import com.vidiun.client.VidiunObjectFactory;
import com.vidiun.client.VidiunParams;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMediaListResponse;



public class ErrorTest extends BaseTest {

	public void testInvalidServiceId() {
		this.vidiunConfig.setEndpoint("http://2.2.2.2");
		this.vidiunConfig.setTimeout(2000);
		
		try {
			this.client = new VidiunClient(this.vidiunConfig);
			client.getSystemService().ping();
			fail("Ping to invalid end-point should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	public void testInvalidServerDnsName() {
		this.vidiunConfig.setEndpoint("http://www.nonexistingvidiun.com");
		this.vidiunConfig.setTimeout(2000);
		
		try {
			this.client = new VidiunClient(this.vidiunConfig);
			client.getSystemService().ping();
			fail("Ping to invalid end-point should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	@SuppressWarnings("serial")
	private class VidiunClientMock extends VidiunClient {
		
		String resultToReturn;

		public VidiunClientMock(VidiunConfiguration config, String res) {
			super(config);
			resultToReturn = res;
		}
		
		@Override
		protected String executeMethod(HttpClient client, PostMethod method) {
			return resultToReturn;
		}

		@Override
		protected HttpClient createHttpClient() {
			return null;
		}
		
		@Override
		protected void closeHttpClient(HttpClient client) {
			return;
		}
	}

	/**
	 * Tests case in which XML format is completely ruined
	 */
	public void testXmlParsingError() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		try {
			mockClient.doQueue();
			fail("Invalid XML response should fail");
		} catch (VidiunApiException e) {
			assertEquals("Failed while parsing response.", e.getMessage());
		}
	}
	
	/**
	 * Tests case in which the response has xml format, but no object type as expected
	 */
	public void testTagInSimpleType() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result><sometag></sometag></result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	/**
	 * Tests case in which the response has xml format, but no object
	 */
	public void testEmptyObjectOrException() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result></result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	public void testTagInObjectDoesntStartWithType() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result><id>1234</id></result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	public void testCharsInsteadOfObject() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result>1234</result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			// Expected behavior
		}
	}
	
	public void testUnknownObjectType() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result><objectType>UnknownObjectType</objectType></result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			assertEquals("Invalid object type", e.getMessage());
		}
	}
	
	public void testNonVidiunObjectType() throws VidiunApiException {
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, "<xml><result><objectType>NSString</objectType></result></xml>");
		mockClient.queueServiceCall("system", "ping", new VidiunParams());
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunObjectFactory.create(resultXmlElement, null);
			fail("Invalid XML response should fail");
		} catch (Exception e) {
			assertEquals("Invalid object type", e.getMessage());
		}
	}
	
	public void testArrayOfUknownEntry() throws VidiunApiException {
		String testXml = "<xml><result><objectType>VidiunMediaListResponse</objectType><objects>" +
				"<item><objectType>NonExistingclass</objectType><id>test1</id><name>test1</name></item>" +
				"<item><objectType>NonExistingclass</objectType><id>test2</id><name>test2</name></item>" +
				"</objects><totalCount>2</totalCount></result></xml>";
		
		VidiunClientMock mockClient = new VidiunClientMock(this.vidiunConfig, testXml);
		mockClient.queueServiceCall("system", "ping", new VidiunParams()); // Just since we need something in the queue
		Element resultXmlElement = mockClient.doQueue();
		try {
			VidiunMediaListResponse res = (VidiunMediaListResponse) VidiunObjectFactory.create(resultXmlElement, null);
			assertEquals(2, res.getTotalCount());
			VidiunMediaEntry entry1 = res.getObjects().get(0);
			VidiunMediaEntry entry2 = res.getObjects().get(1);
			assertTrue(entry1.getId().equals("test1"));
			assertTrue(entry1.getName().equals("test1"));
			assertTrue(entry2.getId().equals("test2"));
			assertTrue(entry2.getName().equals("test2"));
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
	}
}

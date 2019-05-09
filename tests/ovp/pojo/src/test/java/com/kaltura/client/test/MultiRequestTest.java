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

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunMultiResponse;
import com.vidiun.client.enums.VidiunMediaType;
import com.vidiun.client.types.VidiunBaseEntry;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMediaEntryFilterForPlaylist;
import com.vidiun.client.types.VidiunUploadToken;
import com.vidiun.client.types.VidiunUploadedFileTokenResource;
import com.vidiun.client.utils.ParseUtils;


public class MultiRequestTest extends BaseTest{

	@SuppressWarnings("unchecked")
	public void testMultiRequest() throws Exception {
		
		startAdminSession();
		client.startMultiRequest();
		
		// 1. Ping (Bool : void)
		client.getSystemService().ping();
		
		// 2. Create Entry (Object : Object)
		VidiunMediaEntry entry = new VidiunMediaEntry();
		entry.setName("test (" + new Date() + ")");
		entry.setMediaType(VidiunMediaType.IMAGE);
		entry.setReferenceId(getUniqueString());
		InputStream fileData = TestUtils.getTestImage();
		entry = client.getMediaService().add(entry);
		assertNull(entry);
		
		// 3. Upload token (Object : Object)
		VidiunUploadToken uploadToken = new VidiunUploadToken();
		uploadToken.setFileName(testConfig.getUploadImage());
		uploadToken.setFileSize(fileData.available());
		VidiunUploadToken token = client.getUploadTokenService().add(uploadToken);
		assertNull(token);
		
		// 4. Add Content (Object : String, Object)
		VidiunUploadedFileTokenResource resource = new VidiunUploadedFileTokenResource();
		resource.setToken("{3:result:id}");
		entry = client.getMediaService().addContent("{2:result:id}", resource);
		assertNull(entry);
		
		// 5. upload (Object : String, file, boolean)
		uploadToken = client.getUploadTokenService().upload("{3:result:id}", fileData, testConfig.getUploadImage(), fileData.available(), false);
		
		VidiunMultiResponse multi = client.doMultiRequest();
		// 0
		assertNotNull(multi.get(0));
		assertTrue(ParseUtils.parseBool((String)multi.get(0)));
		// 1
		VidiunMediaEntry mEntry = (VidiunMediaEntry) multi.get(1);
		assertNotNull(mEntry);
		assertNotNull(mEntry.getId());
		// 2
		VidiunUploadToken mToken =(VidiunUploadToken) multi.get(2);
		assertNotNull(mToken);
		assertNotNull(mToken.getId());
		// 3
		assertTrue(multi.get(3) instanceof VidiunMediaEntry);
		// 4
		assertTrue(multi.get(4) instanceof VidiunUploadToken);
		
		// Multi request part II:
		client.startMultiRequest();
		
		// execute from filters (Array: Array, int)
		VidiunMediaEntryFilterForPlaylist filter = new VidiunMediaEntryFilterForPlaylist();
		filter.setReferenceIdEqual(mEntry.getReferenceId());
		ArrayList<VidiunMediaEntryFilterForPlaylist> filters = new ArrayList<VidiunMediaEntryFilterForPlaylist>();
		filters.add(filter);
		List<VidiunBaseEntry> res = client.getPlaylistService().executeFromFilters(filters, 5);
		assertNull(res);

		multi = client.doMultiRequest();
		List<VidiunBaseEntry> mRes = (List<VidiunBaseEntry>)multi.get(0);
		assertNotNull(mRes);
		assertEquals(1, mRes.size());
		
		client.getMediaService().delete(mEntry.getId());
	}
	
	
	/**
	 * This function tests that in a case of error in a multi request, the error is parsed correctly
	 * and it doesn't affect the rest of the multi-request.
	 * @throws VidiunApiException
	 */
	public void testMultiRequestWithError() throws Exception {
		
		startAdminSession();
		client.startMultiRequest();
		
		client.getSystemService().ping();
		client.getMediaService().get("Illegal String");
		client.getSystemService().ping();
		
		VidiunMultiResponse multi = client.doMultiRequest();
		assertNotNull(multi.get(0));
		assertTrue(ParseUtils.parseBool((String)multi.get(0)));
		assertTrue(multi.get(1) instanceof VidiunApiException);
		assertNotNull(multi.get(2));
		assertTrue(ParseUtils.parseBool((String)multi.get(2)));
		
	}
}

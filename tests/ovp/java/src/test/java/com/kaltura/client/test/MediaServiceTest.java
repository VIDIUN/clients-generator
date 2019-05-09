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

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.enums.VidiunEntryStatus;
import com.vidiun.client.enums.VidiunEntryType;
import com.vidiun.client.enums.VidiunMediaType;
import com.vidiun.client.enums.VidiunModerationFlagType;
import com.vidiun.client.services.VidiunMediaService;
import com.vidiun.client.types.VidiunBaseEntry;
import com.vidiun.client.types.VidiunDataEntry;
import com.vidiun.client.types.VidiunFlavorAsset;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMediaEntryFilter;
import com.vidiun.client.types.VidiunMediaEntryFilterForPlaylist;
import com.vidiun.client.types.VidiunMediaListResponse;
import com.vidiun.client.types.VidiunModerationFlag;
import com.vidiun.client.types.VidiunModerationFlagListResponse;
import com.vidiun.client.types.VidiunUploadToken;
import com.vidiun.client.types.VidiunUploadedFileTokenResource;
import com.vidiun.client.IVidiunLogger;
import com.vidiun.client.VidiunLogger;

public class MediaServiceTest extends BaseTest {

	private IVidiunLogger logger = VidiunLogger.getLogger(MediaServiceTest.class);
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - add From Url
	 */
	public void testAddFromUrl() {
		if (logger.isEnabled()) 
			logger.info("Test Add From URL");
        
		String name = "test (" + new Date() + ")";
		
		try {
			startUserSession();
			VidiunMediaEntry addedEntry = addClipFromUrl(this, client, name);
			assertNotNull(addedEntry);
			assertNotNull(addedEntry.id);
			assertEquals(name, addedEntry.name);
			assertEquals(VidiunEntryStatus.IMPORT, addedEntry.status);
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
	}
	
	public VidiunMediaEntry addClipFromUrl(BaseTest testContainer,
			VidiunClient client, String name) throws VidiunApiException {

		VidiunMediaEntry entry = new VidiunMediaEntry();

		entry.name = name;
		entry.type = VidiunEntryType.MEDIA_CLIP;
		entry.mediaType = VidiunMediaType.VIDEO;

		VidiunMediaService mediaService = client.getMediaService();
		VidiunMediaEntry addedEntry = mediaService.addFromUrl(entry, testConfig.getTestUrl());

		if(addedEntry != null)
			testContainer.testIds.add(addedEntry.id);
		
		return addedEntry;
	}
	
	/**
	 * Tests the following : 
	 * Media Service - 
	 * 	- add 
	 *  - add Content
	 *  - count
	 * Upload token - 
	 *  - add
	 *  - upload
	 * Flavor asset - 
	 * 	- get by entry id
	 */
	public void testUploadTokenAddGivenFile() {
		
		if (logger.isEnabled())
			logger.info("Test upload token add");
		
		try {
			InputStream fileData = TestUtils.getTestVideo();
			int fileSize = fileData.available();
			String uniqueTag = "test_" + getUniqueString();

			VidiunMediaEntryFilter filter = new VidiunMediaEntryFilter();
			filter.tagsLike = uniqueTag;
			
			startUserSession();
			int sz = client.getMediaService().count(filter);
			
			// Create entry
			VidiunMediaEntry entry = new VidiunMediaEntry();
			entry.name =  "test (" + new Date() + ")";
			entry.type = VidiunEntryType.MEDIA_CLIP;
			entry.mediaType = VidiunMediaType.VIDEO;
			entry.tags = uniqueTag;
			
			entry = client.getMediaService().add(entry);
			assertNotNull(entry);
			
			testIds.add(entry.id);
			
			// Create token
			VidiunUploadToken uploadToken = new VidiunUploadToken();
			uploadToken.fileName = testConfig.getUploadVideo();
			uploadToken.fileSize = fileSize;
			VidiunUploadToken token = client.getUploadTokenService().add(uploadToken);
			assertNotNull(token);
			
			// Define content
			VidiunUploadedFileTokenResource resource = new VidiunUploadedFileTokenResource();
			resource.token = token.id;
			entry = client.getMediaService().addContent(entry.id, resource);
			assertNotNull(entry);
			
			// upload
			uploadToken = client.getUploadTokenService().upload(token.id, fileData, testConfig.getUploadVideo(), fileSize, false);
			assertNotNull(uploadToken);
			
			// Test Creation
			entry = getProcessedEntry(client, entry.id, true);
			assertNotNull(entry);
			
			// Test get flavor asset by entry id.
			List<VidiunFlavorAsset> listFlavors = client.getFlavorAssetService().getByEntryId(entry.id);
			assertNotNull(listFlavors);
			assertTrue(listFlavors.size() >= 1); // Should contain at least the source
			
			// Test count
			int sz2 = client.getMediaService().count(filter);
			assertTrue(sz + 1 == sz2);
			
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
	}
	
	public void testUploadUnexistingFile() throws Exception {
		
		File file = new File("src/test/resources/nonExistingfile.flv");
		
		startUserSession();
		
		// Create token
		VidiunUploadToken uploadToken = new VidiunUploadToken();
		uploadToken.fileName = file.getName();
		uploadToken.fileSize = file.length();
		VidiunUploadToken token = client.getUploadTokenService().add(uploadToken);
		assertNotNull(token);
		
		// upload
		try {
			client.getUploadTokenService().upload(token.id, file, false);
			fail("Uploading non-existing file should fail");
		} catch (IllegalArgumentException e) {
			assert(e.getMessage().contains("is not readable or not a file"));
		}
	}
	
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - add From Url
	 * http://www.vidiun.org/how-update-supposed-work-api-v3
	 */
	public void testUpdate() {
		if (logger.isEnabled())
			logger.info("Test Update Entry");
		
		String name = "test (" + new Date() + ")";
		
		try {
			startUserSession();
			VidiunMediaEntry addedEntry = addTestImage(this, name);
			assertNotNull(addedEntry);
			assertNotNull(addedEntry.id);
			
			String name2 = "test (" + new Date() + ")";
			
			VidiunMediaEntry updatedEntry = new VidiunMediaEntry();
			updatedEntry.name = name2;			
			client.getMediaService().update(addedEntry.id, updatedEntry);
			
			VidiunMediaEntry queriedEntry  = getProcessedEntry(client, addedEntry.id, true);
			assertEquals(name2, queriedEntry.name);
			
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
	}
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - Get
	 */
	public void testBadGet() {
		if (logger.isEnabled())
			logger.info("Starting badGet test");
		
		// look for one we know doesn't exist
		VidiunMediaEntry badEntry = null;
		try {
			startUserSession();
			VidiunMediaService mediaService = this.client.getMediaService();
			badEntry = mediaService.get("badid");
			fail("Getting invalid entry id should fail");
		} catch (VidiunApiException vae) {
			// expected behavior
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
		
		assertNull(badEntry);
	}
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - Get
	 */
	public void testGet() {
		if (logger.isEnabled())
			logger.info("Starting get test");
		
		String name = "test (" + new Date() + ")";
		
		try {
			startUserSession();
			VidiunMediaEntry addedEntry = addTestImage(this, name);
			VidiunMediaService mediaService = this.client.getMediaService();
			VidiunMediaEntry retrievedEntry = mediaService.get(addedEntry.id);
			
			assertNotNull(retrievedEntry);
			assertEquals(addedEntry.id, retrievedEntry.id);
			
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
		
	}

	/**
	 * Tests the following : 
	 * Media Service -
	 *  - list
	 */
	public void testList() {

		if (logger.isEnabled())
			logger.info("Test List");

		try {
			startUserSession();
			// add test clips
			String name1 = "test one (" + new Date() + ")";
			VidiunMediaEntry addedEntry1 = addTestImage(this, name1);
			String name2 = "test two (" + new Date() + ")";
			VidiunMediaEntry addedEntry2 = addTestImage(this, name2);

			// Make sure were updated
			getProcessedEntry(client, addedEntry1.id, true);
			getProcessedEntry(client, addedEntry2.id, true);

			VidiunMediaService mediaService = this.client.getMediaService();

			// get a list of clips starting with "test"
			VidiunMediaEntryFilter filter = new VidiunMediaEntryFilter();
			filter.mediaTypeEqual = null;
			filter.statusEqual = null;
			filter.typeEqual = null;
			filter.nameMultiLikeOr = name1 + "," + name2;

			VidiunMediaListResponse listResponse = mediaService.list(filter);
			assertEquals(listResponse.totalCount, 2);

			boolean found1 = false;
			boolean found2 = false;
			for (VidiunMediaEntry entry : listResponse.objects) {
				if (logger.isEnabled())
					logger.debug("id:" + entry.id);
				if (entry.id.equals(addedEntry1.id)) {
					found1 = true;
				} else if (entry.id.equals(addedEntry2.id)) {
					found2 = true;
				}
			}

			assertTrue(found1);
			assertTrue(found2);

		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		}
	}
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - flag
	 *  - list flags
	 */
	public void testModeration() {
		
		if (logger.isEnabled())
			logger.info("Starting moderation test");
		
		final String FLAG_COMMENTS = "This is a test flag";
		
		if (logger.isEnabled())
			logger.info("Starting addFromUrl test");
        
		String name = "test (" + new Date() + ")";
		
		try {
			
			startAdminSession();

			VidiunMediaEntry addedEntry = addTestImage(this, name);
			//wait for the newly-added clip to process
			getProcessedEntry(client, addedEntry.id);
						
			VidiunMediaService mediaService = this.client.getMediaService();
			
			// flag the clip
			VidiunModerationFlag flag = new VidiunModerationFlag();
			flag.flaggedEntryId = addedEntry.id;
			flag.flagType = VidiunModerationFlagType.SPAM_COMMERCIALS;
			flag.comments = FLAG_COMMENTS;
			mediaService.flag(flag);
			
			// get the list of flags for this entry
			VidiunModerationFlagListResponse flagList = mediaService.listFlags(addedEntry.id);
			assertEquals(flagList.totalCount, 1);

			// check that the flag we put in is the flag we got back
			VidiunModerationFlag retFlag = (VidiunModerationFlag)flagList.objects.get(0);						
			assertEquals(retFlag.flagType, VidiunModerationFlagType.SPAM_COMMERCIALS);
			assertEquals(retFlag.comments, FLAG_COMMENTS);
			
		} catch (Exception e) {
			if (logger.isEnabled())
				logger.error("Got exception testing moderation flag", e);	
			e.printStackTrace();
			fail(e.getMessage());
		} 
		
	}
	
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - delete
	 * @throws IOException 
	 */
	public void testDelete() throws Exception {
		if (logger.isEnabled())
			logger.info("Starting delete test");
		
		String name = "test (" + new Date() + ")";
		String idToDelete = "";
		
		startUserSession();
		VidiunMediaService mediaService = this.client.getMediaService();
		
		// First delete - should succeed
		try {
			
			VidiunMediaEntry addedEntry = addTestImage(this, name);
			assertNotNull(addedEntry);
			idToDelete = addedEntry.id;
			
			// calling this makes the test wait for processing to complete
			// if you call delete while it is processing, the delete doesn't happen
			getProcessedEntry(client,idToDelete);
			mediaService.delete(idToDelete);
			
		} catch (Exception e) {
			if (logger.isEnabled())
				logger.error("Trouble deleting", e);
			fail(e.getMessage());
		} 

		// Second delete - should fail
		VidiunMediaEntry deletedEntry = null;
		try {
			deletedEntry = mediaService.get(idToDelete);
			fail("Getting deleted entry should fail");
		} catch (VidiunApiException vae) {
			// Wanted behavior
		} 
		
		// we whacked this one, so let's not keep track of it		
		this.testIds.remove(testIds.size() - 1);
		assertNull(deletedEntry);
	}
	
	/**
	 * Tests the following : 
	 * Media Service -
	 *  - upload
	 *  - add from uploaded file
	 */
	public void testUpload() {
		if (logger.isEnabled())
			logger.info("Starting delete test");
		
		String name = "test (" + new Date() + ")";
		
		VidiunMediaEntry entry = new VidiunMediaEntry();
		try {
			startUserSession();
			VidiunMediaService mediaService = this.client.getMediaService();

			InputStream fileData = TestUtils.getTestVideo();
			int fileSize = fileData.available();

			String result = mediaService.upload(fileData, testConfig.getUploadVideo(), fileSize);
			if (logger.isEnabled())
				logger.debug("After upload, result:" + result);			
			entry.name = name;
			entry.type = VidiunEntryType.MEDIA_CLIP;
			entry.mediaType = VidiunMediaType.VIDEO;
			entry = mediaService.addFromUploadedFile(entry, result);
		} catch (Exception e) {
			if (logger.isEnabled())
				logger.error("Trouble uploading", e);
			fail(e.getMessage());
		} 
		
		assertNotNull(entry.id);
		
		if (entry.id != null) {
			this.testIds.add(entry.id);
		}
	}
	
	public void testDataServe() {
		if (logger.isEnabled())
			logger.info("Starting test data serve");
		try {
			startUserSession();
			//client.getDataService().serve();
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		} 
	}
	
	public void testPlaylist() {
		if (logger.isEnabled())	
			logger.info("Starting test playlist execute from filters");
		try {
			startAdminSession();
			
			// Create entry
			VidiunMediaEntry entry = addTestImage(this, "test (" + new Date() + ")");
			
			// generate filter
			VidiunMediaEntryFilterForPlaylist filter = new VidiunMediaEntryFilterForPlaylist();
			filter.referenceIdEqual = entry.referenceId;
			ArrayList<VidiunMediaEntryFilterForPlaylist> filters = new ArrayList<VidiunMediaEntryFilterForPlaylist>();
			filters.add(filter);
			List<VidiunBaseEntry> res = client.getPlaylistService().executeFromFilters(filters, 5);
			assertNotNull(res);
			assertEquals(1, res.size());
			
		} catch (Exception e) {
			e.printStackTrace();
			fail(e.getMessage());
		} 
	}
	
	public void testServe() throws Exception {
		String test = "bla bla bla";
		try {
			startUserSession();
			
			// Add Entry
			VidiunDataEntry dataEntry = new VidiunDataEntry();
			dataEntry.name = "test (" + new Date() + ")";
			dataEntry.dataContent = test;
			VidiunDataEntry addedDataEntry = client.getDataService().add(dataEntry);
			
			// serve
			String serveUrl = client.getDataService().serve(addedDataEntry.id);
			URL url = new URL(serveUrl);
			String content = readContent(url);
			assertEquals(test, content);
			
		} catch (MalformedURLException e) {
			e.printStackTrace();
			fail(e.getMessage());
		} 
	}
	
	private String readContent(URL url) {
		StringBuffer sb = new StringBuffer();
		BufferedReader in = null;
		try {
			in = new BufferedReader(new InputStreamReader(url.openStream()));
			String inputLine;

			while ((inputLine = in.readLine()) != null)
				sb.append(inputLine);

			
		} catch (IOException e) {
			e.printStackTrace();
			fail(e.getMessage());
		} finally {
			if(in != null)
				try {
					in.close();
				} catch (IOException e) {
					fail(e.getMessage());
				}
		}

		return sb.toString();
	}
	
}

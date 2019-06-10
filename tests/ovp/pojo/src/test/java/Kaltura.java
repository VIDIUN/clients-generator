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

import java.io.InputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.VidiunConfiguration;
import com.vidiun.client.VidiunMultiResponse;
import com.vidiun.client.enums.VidiunEntryStatus;
import com.vidiun.client.enums.VidiunMediaType;
import com.vidiun.client.enums.VidiunSessionType;
import com.vidiun.client.services.VidiunMediaService;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMediaListResponse;
import com.vidiun.client.types.VidiunPartner;
import com.vidiun.client.types.VidiunUploadToken;
import com.vidiun.client.types.VidiunUploadedFileTokenResource;

import com.vidiun.client.test.VidiunTestConfig;
import com.vidiun.client.test.TestUtils;

public class Vidiun {
	
	private static final int WAIT_BETWEEN_TESTS = 30000;
	protected static VidiunTestConfig testConfig;
	static public VidiunClient client;
	
	public static void main(String[] args) throws IOException {

		if(testConfig == null){
			testConfig = new VidiunTestConfig();
		}
		
		try {

			list();
			multiRequest();
			VidiunMediaEntry entry = addEmptyEntry();
			uploadMediaFileAndAttachToEmptyEntry(entry);
			testIfEntryIsReadyForPublish(entry);
			// cleanup the sample by deleting the entry:
			deleteEntry(entry);
			System.out.println("Sample code finished successfully.");
			
		} catch (VidiunApiException e) {
			System.out.println("Example failed.");
			e.printStackTrace();
		}
	}
	
	/**
	 * Helper function to create the Vidiun client object once and then reuse a static instance.
	 * @return a singleton of <code>VidiunClient</code> used in this case 
	 * @throws VidiunApiException if failed to generate session
	 */
	private static VidiunClient getVidiunClient() throws VidiunApiException
	{
		if (client != null) {
			return client;
		}
		
		// Set Constants
		int partnerId = testConfig.getPartnerId();
		String adminSecret = testConfig.getAdminSecret();
		String userId = testConfig.getUserId();
		
		// Generate configuration
		VidiunConfiguration config = new VidiunConfiguration();
		config.setEndpoint(testConfig.getServiceUrl());
		
		try {
			// Create the client and open session
			client = new VidiunClient(config);
			String vs = client.generateSession(adminSecret, userId, VidiunSessionType.ADMIN, partnerId);
			client.setSessionId(vs);
		} catch(Exception ex) {
			client = null;
			throw new VidiunApiException("Failed to generate session");
		}
		
		System.out.println("Generated VS locally: [" + client.getSessionId() + "]");
		return client;
	}
	
	/** 
	 * lists all media in the account.
	 */
	private static void list() throws VidiunApiException {

		VidiunMediaListResponse list = getVidiunClient().getMediaService().list();
		if (list.getTotalCount() > 0) {
			System.out.println("The account contains " + list.getTotalCount() + " entries.");
			for (VidiunMediaEntry entry : list.getObjects()) {
				System.out.println("\t \"" + entry.getName() + "\"");
			}
		} else {
			System.out.println("This account doesn't have any entries in it.");
		}
	}

	/**
	 * shows how to chain requests together to call a multi-request type where several requests are called in a single request.
	 */
	private static void multiRequest() throws VidiunApiException
 {
		VidiunClient client = getVidiunClient();
		client.startMultiRequest();
		client.getBaseEntryService().count();
		client.getPartnerService().getInfo();
		client.getPartnerService().getUsage(2010);
		VidiunMultiResponse multi = client.doMultiRequest();
		VidiunPartner partner = (VidiunPartner) multi.get(1);
		System.out.println("Got Admin User email: " + partner.getAdminEmail());

	}
	
	/** 
	 * creates an empty media entry and assigns basic metadata to it.
	 * @return the generated <code>VidiunMediaEntry</code>
	 * @throws VidiunApiException 
	 */
	private static VidiunMediaEntry addEmptyEntry() throws VidiunApiException {
		System.out.println("Creating an empty Vidiun Entry (without actual media binary attached)...");
		VidiunMediaEntry entry = new VidiunMediaEntry();
		entry.setName("An Empty Vidiun Entry Test");
		entry.setMediaType(VidiunMediaType.VIDEO);
		VidiunMediaEntry newEntry = getVidiunClient().getMediaService().add(entry);
		System.out.println("The id of our new Video Entry is: " + newEntry.getId());
		return newEntry;
	}
	
	/**
	 *  uploads a video file to Vidiun and assigns it to a given Media Entry object
	 */
	private static void uploadMediaFileAndAttachToEmptyEntry(VidiunMediaEntry entry) throws VidiunApiException
	{
			VidiunClient client = getVidiunClient();			
			System.out.println("Uploading a video file...");
			
			// upload upload token
			VidiunUploadToken upToken = client.getUploadTokenService().add();
			VidiunUploadedFileTokenResource fileTokenResource = new VidiunUploadedFileTokenResource();
			
			// Connect to media entry and update name
			fileTokenResource.setToken(upToken.getId());
			entry = client.getMediaService().addContent(entry.getId(), fileTokenResource);
			
			// Upload actual data
			try
			{
				InputStream fileData = TestUtils.getTestVideo();
				int fileSize = fileData.available();

				client.getUploadTokenService().upload(upToken.getId(), fileData, testConfig.getUploadVideo(), fileSize);
				
				System.out.println("Uploaded a new Video file to entry: " + entry.getId());
			}
			catch (FileNotFoundException e)
			{
				System.out.println("Failed to open test video file");
			}
			catch (IOException e)
			{
				System.out.println("Failed to read test video file");
			}
	}
	
	/** 
	 * periodically calls the Vidiun API to check that a given video entry has finished transcoding and is ready for playback. 
	 * @param entry The <code>VidiunMediaEntry</code> we want to test
	 */
	private static void testIfEntryIsReadyForPublish(VidiunMediaEntry entry)
			throws VidiunApiException {

		System.out.println("Testing if Media Entry has finished processing and ready to be published...");
		VidiunMediaService mediaService = getVidiunClient().getMediaService();
		while (true) {
			VidiunMediaEntry retrievedEntry = mediaService.get(entry.getId());
			if (retrievedEntry.getStatus() == VidiunEntryStatus.READY) {
				break;
			}
			System.out.println("Media not ready yet. Waiting 30 seconds.");
			try {
				Thread.sleep(WAIT_BETWEEN_TESTS);
			} catch (InterruptedException ie) {
			}
		}
		System.out.println("Entry id: " + entry.getId() + " is now ready to be published and played.");
	}

	/** 
	 * deletes a given entry
	 * @param entry the <code>VidiunMediaEntry</code> we want to delete
	 * @throws VidiunApiException
	 */
	private static void deleteEntry(VidiunMediaEntry entry)
			throws VidiunApiException {
		System.out.println("Deleting entry id: " + entry.getId());
		getVidiunClient().getMediaService().delete(entry.getId());
	}
}

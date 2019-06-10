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

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.enums.VidiunUiConfCreationMode;
import com.vidiun.client.services.VidiunUiConfService;
import com.vidiun.client.types.VidiunUiConf;
import com.vidiun.client.types.VidiunUiConfListResponse;
import com.vidiun.client.IVidiunLogger;
import com.vidiun.client.VidiunLogger;

public class UiConfServiceTest extends BaseTest {
	private IVidiunLogger logger = VidiunLogger.getLogger(UiConfServiceTest.class);

	// keeps track of test vids we upload so they can be cleaned up at the end
	protected List<Integer> testUiConfIds = new ArrayList<Integer>();
	
	protected VidiunUiConf addUiConf(String name) throws VidiunApiException {

		VidiunUiConfService uiConfService = client.getUiConfService();

		VidiunUiConf uiConf = new VidiunUiConf();
		uiConf.setName(name);
		uiConf.setDescription("Ui conf unit test");
		uiConf.setHeight(373);
		uiConf.setWidth(750);
		uiConf.setCreationMode(VidiunUiConfCreationMode.ADVANCED);
		uiConf.setConfFile("NON_EXISTING_CONF_FILE");
		
		// this uiConf won't be editable in the VMC until it gets a config added to it, I think
		
		VidiunUiConf addedConf = uiConfService.add(uiConf);
				
		this.testUiConfIds.add(addedConf.getId());
		
		return addedConf;
		
	}
	
	public void testAddUiConf() throws Exception {
		if (logger.isEnabled())
			logger.info("Starting ui conf add test");
		
		try {			
			startAdminSession();
			String name = "Test UI Conf (" + new Date() + ")";
			VidiunUiConf addedConf = addUiConf(name);
			assertNotNull(addedConf);
			
		} catch (VidiunApiException e) {
			if (logger.isEnabled())
				logger.error(e);
			fail(e.getMessage());
		}
		
	}
	
	public void testGetUiConf() throws Exception {
		if (logger.isEnabled())
			logger.info("Starting ui get test");
		
		try {			
			startAdminSession();
			String name = "Test UI Conf (" + new Date() + ")";
			VidiunUiConf addedConf = addUiConf(name);
			
			int addedConfId = addedConf.getId();
			VidiunUiConfService confService = this.client.getUiConfService();
			VidiunUiConf retrievedConf = confService.get(addedConfId);
			assertEquals(retrievedConf.getId(), addedConfId);
			
		} catch (VidiunApiException e) {
			if (logger.isEnabled())
				logger.error(e);
			fail(e.getMessage());
		}
		
	}
	
	public void testDeleteUiConf() throws Exception {
		if (logger.isEnabled())
			logger.info("Starting ui conf delete test");
		
		try {			
			startAdminSession();
			String name = "Test UI Conf (" + new Date() + ")";
			VidiunUiConf addedConf = addUiConf(name);
			
			int addedConfId = addedConf.getId();
			
			VidiunUiConfService confService = this.client.getUiConfService();
			
			confService.delete(addedConfId);
			
			try {
				confService.get(addedConfId);
				fail("Getting deleted ui-conf should fail");
			} catch (VidiunApiException vae) {
				// Wanted behavior
			} finally {
				// we whacked this one, so let's not keep track of it		
				this.testUiConfIds.remove(testUiConfIds.size() - 1);
			}
						
		} catch (VidiunApiException e) {
			if (logger.isEnabled())
				logger.error(e);
			fail(e.getMessage());
		}
	}

	public void testListUiConf() throws Exception {
		if (logger.isEnabled())
			logger.info("Starting ui conf list test");
		
		try {
			startAdminSession();
			VidiunUiConfService uiConfService = client.getUiConfService();
			assertNotNull(uiConfService);
			
			VidiunUiConfListResponse listResponse = uiConfService.list();
			assertNotNull(listResponse);
			
			for (VidiunUiConf uiConf : listResponse.getObjects()) {
				if (logger.isEnabled())
					logger.debug("uiConf id:" + uiConf.getId() + " name:" + uiConf.getName());
			}
			
		} catch (VidiunApiException e) {
			if (logger.isEnabled())
				logger.error(e);
			fail(e.getMessage());
		}
	}
	
	@Override
	protected void tearDown() throws Exception {
		
		super.tearDown();
		
		if (!doCleanup) return;
		
		if (logger.isEnabled())
			logger.info("Cleaning up test UI Conf entries after test");
		
		VidiunUiConfService uiConfService = this.client.getUiConfService();
		for (Integer id : this.testUiConfIds) {
			if (logger.isEnabled())
				logger.debug("Deleting UI conf " + id);
			try {
				uiConfService.delete(id);			
			} catch (Exception e) {
				if (logger.isEnabled())
					logger.error("Couldn't delete " + id, e);
			}
		} //next id
	}
}

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

import java.io.IOException;
import java.util.ArrayList;

import com.vidiun.client.enums.VidiunContainerFormat;
import com.vidiun.client.enums.VidiunNullableBoolean;
import com.vidiun.client.enums.VidiunSiteRestrictionType;
import com.vidiun.client.types.VidiunAccessControl;
import com.vidiun.client.types.VidiunBaseRestriction;
import com.vidiun.client.types.VidiunConversionProfile;
import com.vidiun.client.types.VidiunCountryRestriction;
import com.vidiun.client.types.VidiunSiteRestriction;
import com.vidiun.client.types.VidiunThumbParams;

public class MediaServiceFieldsTest extends BaseTest {

	/**
	 * Tests that when we set values to their matching "NULL" their value isn't passed to the server.
	 * The parameter types that are tested : 
	 * String, int, EnumAsInt, EnumAsString.
	 * @throws IOException 
	 */
	public void testSetFieldValueShouldNotPass() throws Exception {

		startAdminSession();

		final String testString = "Vidiun test string";
		final int testInt = 42;
		final VidiunNullableBoolean testEnumAsInt = VidiunNullableBoolean.FALSE_VALUE;
		final VidiunContainerFormat testEnumAsString = VidiunContainerFormat.ISMV;

		VidiunThumbParams params = new VidiunThumbParams();
		params.name = testString;
		params.description = testString;
		params.density = testInt;
		params.isSystemDefault = testEnumAsInt;
		params.format = testEnumAsString;

		// Regular update works
		params = client.getThumbParamsService().add(params);

		assertEquals(testString, params.description);
		assertEquals(testInt, params.density);
		assertEquals(testEnumAsInt, params.isSystemDefault);
		assertEquals(testEnumAsString, params.format);

		// Null value not passed
		VidiunThumbParams params2 = new VidiunThumbParams();
		params2.description = null;
		params2.density = Integer.MIN_VALUE;
		params2.isSystemDefault = null;
		params2.format = null;

		params2 = client.getThumbParamsService().update(params.id, params2);
		assertEquals(testString, params2.description);
		assertEquals(testInt, params2.density);
		assertEquals(testEnumAsInt, params2.isSystemDefault);
		assertEquals(testEnumAsString, params2.format);

		client.getThumbParamsService().delete(params.id);
	}

	
	/**
	 * Tests that when we ask to set parameters to null, we indeed set them to null
	 * The parameter types that are tested : String
	 * @throws IOException 
	 */
	public void testSetFieldsToNullString() throws Exception {

		startAdminSession();

		final String testString = "Vidiun test string";

		VidiunThumbParams params = new VidiunThumbParams();
		params.name = testString;
		params.description = testString;

		// Regular update works
		params = client.getThumbParamsService().add(params);

		assertEquals(testString, params.description);

		// Set to null
		VidiunThumbParams params2 = new VidiunThumbParams();
		params2.description = "__null_string__";

		params2 = client.getThumbParamsService().update(params.id, params2);
		assertNull(params2.description);

		client.getThumbParamsService().delete(params.id);
		
	}
	
	/**
	 * Tests that when we ask to set parameters to null, we indeed set them to null
	 * The parameter types that are tested : int
	 * @throws IOException 
	 */
	public void testSetFieldsToNullInt() throws Exception {

		startAdminSession();
		final int testInt = 42;

		VidiunConversionProfile profile = new VidiunConversionProfile();
		profile.name = "Vidiun test string";
		profile.flavorParamsIds = "0";
		profile.storageProfileId = testInt;

		// Regular update works
		profile = client.getConversionProfileService().add(profile);

		assertEquals(testInt, profile.storageProfileId);

		// Set to null
		VidiunConversionProfile profile2 = new VidiunConversionProfile();
		profile2.storageProfileId = Integer.MAX_VALUE;

		profile2 = client.getConversionProfileService().update(profile.id, profile2);
		assertEquals(Integer.MIN_VALUE, profile2.storageProfileId);

		client.getConversionProfileService().delete(profile.id);
		
		
	}
	
	/**
	 * Tests that array update is working - 
	 * tests empty array, Null array & full array.
	 */
	public void testArrayConversion() throws Exception {
		
		VidiunSiteRestriction resA = new VidiunSiteRestriction();
		resA.siteRestrictionType = VidiunSiteRestrictionType.RESTRICT_SITE_LIST;
		resA.siteList = "ResA";
		VidiunCountryRestriction resB = new VidiunCountryRestriction();
		resB.countryList = "IllegalCountry";
		
		ArrayList<VidiunBaseRestriction> restrictions = new ArrayList<VidiunBaseRestriction>();
		restrictions.add(resA);
		restrictions.add(resB);
		
		VidiunAccessControl accessControl = new VidiunAccessControl();
		accessControl.name = "test access control";
		accessControl.restrictions = restrictions;
		
		startAdminSession();
		accessControl = client.getAccessControlService().add(accessControl);
		
		assertNotNull(accessControl.restrictions);
		assertEquals(2, accessControl.restrictions.size());
		
		// Test null update - shouldn't update
		VidiunAccessControl accessControl2 = new VidiunAccessControl();
		accessControl2.name = "updated access control";
		accessControl2.restrictions = null; 
		accessControl2 = client.getAccessControlService().update(accessControl.id, accessControl2);
		
		assertEquals(2, accessControl2.restrictions.size());
		
		// Test update Empty array - should update
		VidiunAccessControl accessControl3 = new VidiunAccessControl();
		accessControl3.name = "reset access control";
		accessControl3.restrictions = new ArrayList<VidiunBaseRestriction>(); 
		accessControl3 = client.getAccessControlService().update(accessControl.id, accessControl3);
		
		assertEquals(0, accessControl3.restrictions.size());

		// Delete entry
		client.getAccessControlService().delete(accessControl.id);
	}

}

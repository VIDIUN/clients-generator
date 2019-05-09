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

import com.vidiun.client.enums.VidiunMediaType;
import com.vidiun.client.enums.VidiunMetadataObjectType;
import com.vidiun.client.types.VidiunCategory;
import com.vidiun.client.types.VidiunCategoryEntry;
import com.vidiun.client.types.VidiunCategoryEntryFilter;
import com.vidiun.client.types.VidiunCategoryEntryListResponse;
import com.vidiun.client.types.VidiunDetachedResponseProfile;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMetadata;
import com.vidiun.client.types.VidiunMetadataFilter;
import com.vidiun.client.types.VidiunMetadataListResponse;
import com.vidiun.client.types.VidiunMetadataProfile;
import com.vidiun.client.types.VidiunResponseProfile;
import com.vidiun.client.types.VidiunResponseProfileHolder;
import com.vidiun.client.types.VidiunResponseProfileMapping;


public class ResponseProfileTest extends BaseTest{

	public void testEntryCategoriesAndMetadata() throws Exception {
		VidiunMediaEntry entry = null;
		VidiunCategory category = null;
		VidiunMetadataProfile categoryMetadataProfile = null;
		VidiunResponseProfile responseProfile = null;
		
		try{
			String xsd = "<xsd:schema xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n";
			xsd += "	<xsd:element name=\"metadata\">\n";
			xsd += "		<xsd:complexType>\n";
			xsd += "			<xsd:sequence>\n";
			xsd += "				<xsd:element name=\"Choice\" minOccurs=\"0\" maxOccurs=\"1\">\n";
			xsd += "					<xsd:annotation>\n";
			xsd += "						<xsd:documentation></xsd:documentation>\n";
			xsd += "						<xsd:appinfo>\n";
			xsd += "							<label>Example choice</label>\n";
			xsd += "							<key>choice</key>\n";
			xsd += "							<searchable>true</searchable>\n";
			xsd += "							<description>Example choice</description>\n";
			xsd += "						</xsd:appinfo>\n";
			xsd += "					</xsd:annotation>\n";
			xsd += "					<xsd:simpleType>\n";
			xsd += "						<xsd:restriction base=\"listType\">\n";
			xsd += "							<xsd:enumeration value=\"on\" />\n";
			xsd += "							<xsd:enumeration value=\"off\" />\n";
			xsd += "						</xsd:restriction>\n";
			xsd += "					</xsd:simpleType>\n";
			xsd += "				</xsd:element>\n";
			xsd += "				<xsd:element name=\"FreeText\" minOccurs=\"0\" maxOccurs=\"1\" type=\"textType\">\n";
			xsd += "					<xsd:annotation>\n";
			xsd += "						<xsd:documentation></xsd:documentation>\n";
			xsd += "						<xsd:appinfo>\n";
			xsd += "							<label>Free text</label>\n";
			xsd += "							<key>freeText</key>\n";
			xsd += "							<searchable>true</searchable>\n";
			xsd += "							<description>Free text</description>\n";
			xsd += "						</xsd:appinfo>\n";
			xsd += "					</xsd:annotation>\n";
			xsd += "				</xsd:element>\n";
			xsd += "			</xsd:sequence>\n";
			xsd += "		</xsd:complexType>\n";
			xsd += "	</xsd:element>\n";
			xsd += "	<xsd:complexType name=\"textType\">\n";
			xsd += "		<xsd:simpleContent>\n";
			xsd += "			<xsd:extension base=\"xsd:string\" />\n";
			xsd += "		</xsd:simpleContent>\n";
			xsd += "	</xsd:complexType>\n";
			xsd += "	<xsd:complexType name=\"objectType\">\n";
			xsd += "		<xsd:simpleContent>\n";
			xsd += "			<xsd:extension base=\"xsd:string\" />\n";
			xsd += "		</xsd:simpleContent>\n";
			xsd += "	</xsd:complexType>\n";
			xsd += "	<xsd:simpleType name=\"listType\">\n";
			xsd += "		<xsd:restriction base=\"xsd:string\" />\n";
			xsd += "	</xsd:simpleType>\n";
			xsd += "</xsd:schema>";
			
			String xml = "<metadata>\n";
			xml += "	<Choice>on</Choice>\n";
			xml += "	<FreeText>example text </FreeText>\n";
			xml += "</metadata>";
						
			entry = createEntry();
			category = createCategory();
			categoryMetadataProfile = createMetadataProfile(VidiunMetadataObjectType.CATEGORY, xsd);

			VidiunMetadataFilter metadataFilter = new VidiunMetadataFilter();
			metadataFilter.setMetadataObjectTypeEqual(VidiunMetadataObjectType.CATEGORY);
			metadataFilter.setMetadataProfileIdEqual(categoryMetadataProfile.getId());

			VidiunResponseProfileMapping metadataMapping = new VidiunResponseProfileMapping();
			metadataMapping.setFilterProperty("objectIdEqual");
			metadataMapping.setParentProperty("categoryId");
			
			ArrayList<VidiunResponseProfileMapping> metadataMappings = new ArrayList<VidiunResponseProfileMapping>();
			metadataMappings.add(metadataMapping);

			VidiunDetachedResponseProfile metadataResponseProfile = new VidiunDetachedResponseProfile();
			metadataResponseProfile.setName("metadata");
			metadataResponseProfile.setFilter(metadataFilter);
			metadataResponseProfile.setMappings(metadataMappings);
			
			ArrayList<VidiunDetachedResponseProfile> categoryEntryRelatedProfiles = new ArrayList<VidiunDetachedResponseProfile>();
			categoryEntryRelatedProfiles.add(metadataResponseProfile);

			VidiunCategoryEntryFilter categoryEntryFilter = new VidiunCategoryEntryFilter();
			
			VidiunResponseProfileMapping categoryEntryMapping = new VidiunResponseProfileMapping();
			categoryEntryMapping.setFilterProperty("entryIdEqual");
			categoryEntryMapping.setParentProperty("id");
			
			ArrayList<VidiunResponseProfileMapping> categoryEntryMappings = new ArrayList<VidiunResponseProfileMapping>();
			categoryEntryMappings.add(categoryEntryMapping);
			
			VidiunDetachedResponseProfile categoryEntryResponseProfile = new VidiunDetachedResponseProfile();
			categoryEntryResponseProfile.setName("categoryEntry");
			categoryEntryResponseProfile.setRelatedProfiles(categoryEntryRelatedProfiles);
			categoryEntryResponseProfile.setFilter(categoryEntryFilter);
			categoryEntryResponseProfile.setMappings(categoryEntryMappings);
			
			ArrayList<VidiunDetachedResponseProfile> entryRelatedProfiles = new ArrayList<VidiunDetachedResponseProfile>();
			entryRelatedProfiles.add(categoryEntryResponseProfile);
			
			responseProfile = new VidiunResponseProfile();
			responseProfile.setName("rp" + System.currentTimeMillis());
			responseProfile.setSystemName(responseProfile.getName());
			responseProfile.setRelatedProfiles(entryRelatedProfiles);
			
			responseProfile = client.getResponseProfileService().add(responseProfile);
			assertNotNull(responseProfile.getId());
			assertNotNull(responseProfile.getRelatedProfiles());
			assertEquals(1, responseProfile.getRelatedProfiles().size());
			
			VidiunCategoryEntry categoryEntry = addEntryToCategory(entry.getId(), category.getId());
			VidiunMetadata categoryMetadata = createMetadata(VidiunMetadataObjectType.CATEGORY, Integer.toString(category.getId()), categoryMetadataProfile.getId(), xml);
			
			VidiunResponseProfileHolder responseProfileHolder = new VidiunResponseProfileHolder();
			responseProfileHolder.setId(responseProfile.getId());
	
			startAdminSession();
			client.setResponseProfile(responseProfileHolder);
			VidiunMediaEntry getEntry = client.getMediaService().get(entry.getId());
			assertEquals(getEntry.getId(), entry.getId());
			
			assertNotNull(getEntry.getRelatedObjects());
			assertTrue(getEntry.getRelatedObjects().containsKey(categoryEntryResponseProfile.getName()));
			VidiunCategoryEntryListResponse categoryEntryList = (VidiunCategoryEntryListResponse) getEntry.getRelatedObjects().get(categoryEntryResponseProfile.getName());
			assertEquals(1, categoryEntryList.getTotalCount());
			VidiunCategoryEntry getCategoryEntry = categoryEntryList.getObjects().get(0);
			assertEquals(getCategoryEntry.getCreatedAt(), categoryEntry.getCreatedAt());

			assertNotNull(getCategoryEntry.getRelatedObjects());
			assertTrue(getCategoryEntry.getRelatedObjects().containsKey(metadataResponseProfile.getName()));
			VidiunMetadataListResponse metadataList = (VidiunMetadataListResponse) getCategoryEntry.getRelatedObjects().get(metadataResponseProfile.getName());
			assertEquals(1, metadataList.getTotalCount());
			VidiunMetadata getMetadata = metadataList.getObjects().get(0);
			assertEquals(categoryMetadata.getId(), getMetadata.getId());
			assertEquals(xml, getMetadata.getXml());
		}
		finally{
			if(responseProfile != null && responseProfile.getId() > 0)
				deleteResponseProfile(responseProfile.getId());

			if(entry != null && entry.getId() != null)
				deleteEntry(entry.getId());

			if(category != null && category.getId() > 0)
				deleteCategory(category.getId());

			if(categoryMetadataProfile != null && categoryMetadataProfile.getId() > 0)
				deleteMetadataProfile(categoryMetadataProfile.getId());
		}
	}

	protected VidiunMetadata createMetadata(VidiunMetadataObjectType objectType, String objectId, int metadataProfileId, String xmlData) throws Exception {
		startAdminSession();

		VidiunMetadata metadata = client.getMetadataService().add(metadataProfileId, objectType, objectId, xmlData);
		assertNotNull(metadata.getId());
		
		return metadata;
	}

	protected VidiunMetadataProfile createMetadataProfile(VidiunMetadataObjectType objectType, String xsdData) throws Exception {
		startAdminSession();

		VidiunMetadataProfile metadataProfile = new VidiunMetadataProfile();
		metadataProfile.setMetadataObjectType(objectType);
		metadataProfile.setName("mp" + System.currentTimeMillis());
		
		metadataProfile = client.getMetadataProfileService().add(metadataProfile, xsdData);
		assertNotNull(metadataProfile.getId());
		
		return metadataProfile;
	}

	protected VidiunCategoryEntry addEntryToCategory(String entryId, int categoryId) throws Exception {
		startAdminSession();

		VidiunCategoryEntry categoryEntry = new VidiunCategoryEntry();
		categoryEntry.setEntryId(entryId);
		categoryEntry.setCategoryId(categoryId);
		
		categoryEntry = client.getCategoryEntryService().add(categoryEntry);
		assertNotNull(categoryEntry.getCreatedAt());
		
		return categoryEntry;
	}

	protected VidiunMediaEntry createEntry() throws Exception {
		startAdminSession();

		VidiunMediaEntry entry = new VidiunMediaEntry();
		entry.setMediaType(VidiunMediaType.VIDEO);
		
		entry = client.getMediaService().add(entry);
		assertNotNull(entry.getId());
		
		return entry;
	}

	protected VidiunCategory createCategory() throws Exception {
		startAdminSession();

		VidiunCategory category = new VidiunCategory();
		category.setName("c" + System.currentTimeMillis());
		
		category = client.getCategoryService().add(category);
		assertNotNull(category.getId());
		
		return category;
	}

	protected void deleteCategory(int id) throws Exception {
		startAdminSession();
		client.getCategoryService().delete(id);
	}

	protected void deleteEntry(String id) throws Exception {
		startAdminSession();
		client.getBaseEntryService().delete(id);
	}

	protected void deleteResponseProfile(int id) throws Exception {
		startAdminSession();
		client.getResponseProfileService().delete(id);
	}

	protected void deleteMetadataProfile(int id) throws Exception {
		startAdminSession();
		client.getMetadataProfileService().delete(id);
	}
	
}

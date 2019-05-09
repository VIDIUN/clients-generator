/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.vidiun.services;

import java.util.List;

import android.util.Log;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.services.VidiunBaseEntryService;
import com.vidiun.client.services.VidiunFlavorAssetService;
import com.vidiun.client.types.VidiunEntryContextDataParams;
import com.vidiun.client.types.VidiunEntryContextDataResult;
import com.vidiun.client.types.VidiunFilterPager;
import com.vidiun.client.types.VidiunFlavorAsset;
import com.vidiun.client.types.VidiunFlavorAssetFilter;
import com.vidiun.client.types.VidiunFlavorAssetListResponse;

/**
 * Retrieve information and invoke actions on Flavor Asset
 */
public class FlavorAsset {

    /**
     * List Flavor Assets by filter and pager
     *
     * @param TAG constant in your class
     * @param entryId Entry id
     * @param pageindex The page number for which {pageSize} of objects should
     * be retrieved (Default is 1)
     * @param pageSize The number of objects to retrieve. (Default is 30,
     * maximum page size is 500)
     *
     * @return The list of all categories
     *
     * @throws VidiunApiException
     */
    public static List<VidiunFlavorAsset> listAllFlavorAssets(String TAG, String entryId, int pageIndex, int pageSize) throws VidiunApiException {
        // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        VidiunFlavorAssetService flavorAssetService = client.getFlavorAssetService();

        // create a new filter to filter entries - not mandatory
        VidiunFlavorAssetFilter filter = new VidiunFlavorAssetFilter();
        filter.entryIdEqual = entryId;
        // create a new pager to choose how many and which entries should be recieved
        // out of the filtered entries - not mandatory
        VidiunFilterPager pager = new VidiunFilterPager();
        pager.pageIndex = pageIndex;
        pager.pageSize = pageSize;

        // execute the list action of the mediaService object to recieve the list of entries
        VidiunFlavorAssetListResponse listResponseFlavorAsset = flavorAssetService.list(filter);

        return listResponseFlavorAsset.objects;
    }

    /**
     * Get download URL for the asset
     *
     * @param TAG constant in your class
     * @param id asset id
     *
     * @return The asset url
     */
    public static String getUrl(String TAG, String id) throws VidiunApiException {
        // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        // create a new mediaService object for our client
        VidiunFlavorAssetService mediaService = client.getFlavorAssetService();
        String url = mediaService.getUrl(id);
        Log.w(TAG, "URL for the asset: " + url);
        return url;
    }
    
    /**
     * Return flavorAsset lists from getContextData call
     * @param TAG
     * @param entryId
     * @param flavorTags
     * @return
     * @throws VidiunApiException
     */
    public static List<VidiunFlavorAsset> listAllFlavorsFromContext(String TAG, String entryId, String flavorTags) throws VidiunApiException {
    	 // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        VidiunEntryContextDataParams params = new VidiunEntryContextDataParams();
        params.flavorTags = flavorTags;
        VidiunBaseEntryService baseEntryService = client.getBaseEntryService();
        VidiunEntryContextDataResult res = baseEntryService.getContextData(entryId, params);
        return res.flavorAssets;
    }
}

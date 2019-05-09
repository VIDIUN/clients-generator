/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.vidiun.services;

import java.util.List;

import android.util.Log;

import com.vidiun.client.Client;
import com.vidiun.client.services.BaseEntryService;
import com.vidiun.client.services.FlavorAssetService;
import com.vidiun.client.types.APIException;
import com.vidiun.client.types.EntryContextDataParams;
import com.vidiun.client.types.EntryContextDataResult;
import com.vidiun.client.types.FilterPager;
import com.vidiun.client.types.FlavorAsset;
import com.vidiun.client.types.FlavorAssetFilter;
import com.vidiun.client.types.ListResponse;
import com.vidiun.client.utils.request.RequestBuilder;
import com.vidiun.client.utils.response.OnCompletion;
import com.vidiun.client.utils.response.base.Response;
import com.vidiun.utils.ApiHelper;

/**
 * Retrieve information and invoke actions on Flavor Asset
 */
public class FlavorAssets {

    
    /**
     * Return flavorAsset lists from getContextData call
     * @param TAG
     * @param entryId
     * @param flavorTags
     * @return
     * @throws APIException
     */
    public static void listAllFlavorsFromContext(String TAG, String entryId, String flavorTags, OnCompletion<Response<EntryContextDataResult>> onCompletion) throws APIException {
        EntryContextDataParams params = new EntryContextDataParams();
        params.setFlavorTags(flavorTags);
        BaseEntryService.GetContextDataBaseEntryBuilder requestBuilder = BaseEntryService.getContextData(entryId, params)
        .setCompletion(onCompletion);
    }
}

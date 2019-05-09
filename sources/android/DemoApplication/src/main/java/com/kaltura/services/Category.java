package com.vidiun.services;

import java.util.List;

import android.util.Log;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.services.VidiunCategoryService;
import com.vidiun.client.types.VidiunCategory;
import com.vidiun.client.types.VidiunCategoryFilter;
import com.vidiun.client.types.VidiunCategoryListResponse;
import com.vidiun.client.types.VidiunFilterPager;

/**
 * Add & Manage Categories *
 */
public class Category {

    /**
     * Get a list of all categories on the vidiun server
     *
     * @param TAG constant in your class
     * @param pageindex The page number for which {pageSize} of objects should
     * be retrieved (Default is 1)
     * @param pageSize The number of objects to retrieve. (Default is 30,
     * maximum page size is 500)
     *
     * @return The list of all categories
     *
     * @throws VidiunApiException
     */
    public static List<VidiunCategory> listAllCategories(String TAG, int pageIndex, int pageSize) throws VidiunApiException {
        // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        // create a new mediaService object for our client
        VidiunCategoryService categoryService = client.getCategoryService();

        // create a new filter to filter entries - not mandatory
        VidiunCategoryFilter filter = new VidiunCategoryFilter();
        //filter.mediaTypeEqual = mediaType;

        // create a new pager to choose how many and which entries should be recieved
        // out of the filtered entries - not mandatory
        VidiunFilterPager pager = new VidiunFilterPager();
        pager.pageIndex = pageIndex;
        pager.pageSize = pageSize;

        // execute the list action of the mediaService object to recieve the list of entries
        VidiunCategoryListResponse listResponse = categoryService.list(filter);

        // loop through all entries in the reponse list and print their id.
        Log.w(TAG, "Entries list :");
        int i = 0;
        for (VidiunCategory entry : listResponse.objects) {
            Log.w(TAG, ++i + " id:" + entry.id + " name:" + entry.name + " depth: " + entry.depth + " fullName: " + entry.fullName);
        }
        return listResponse.objects;
    }
}

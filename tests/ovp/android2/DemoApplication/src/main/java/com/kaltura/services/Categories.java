package com.vidiun.services;

import java.util.List;

import android.util.Log;

import com.vidiun.client.Client;
import com.vidiun.client.services.CategoryService;
import com.vidiun.client.types.APIException;
import com.vidiun.client.types.Category;
import com.vidiun.client.types.CategoryFilter;
import com.vidiun.client.types.ListResponse;
import com.vidiun.client.types.FilterPager;
import com.vidiun.client.utils.request.RequestBuilder;
import com.vidiun.client.utils.response.OnCompletion;
import com.vidiun.client.utils.response.base.Response;
import com.vidiun.utils.ApiHelper;

/**
 * Add & Manage Categories *
 */
public class Categories {

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
     * @throws APIException
     */
    public static void listAllCategories(final String TAG, int pageIndex, int pageSize, final OnCompletion<Response<ListResponse<Category>>> onCompletion) throws APIException {
        // create a new filter to filter entries - not mandatory
        CategoryFilter filter = new CategoryFilter();
        //filter.mediaTypeEqual = mediaType;

        // create a new pager to choose how many and which entries should be recieved
        // out of the filtered entries - not mandatory
        FilterPager pager = new FilterPager();
        pager.setPageIndex(pageIndex);
        pager.setPageSize(pageSize);

        // execute the list action of the mediaService object to recieve the list of entries
        CategoryService.ListCategoryBuilder requestBuilder = CategoryService.list(filter)
        .setCompletion(new OnCompletion<Response<ListResponse<Category>>>() {
            @Override
            public void onComplete(Response<ListResponse<Category>> response) {

                // loop through all entries in the reponse list and print their id.
                Log.w(TAG, "Entries list :");
                int i = 0;
                for (Category entry : response.results.getObjects()) {
                    Log.w(TAG, ++i + " id:" + entry.getId() + " name:" + entry.getName() + " depth: " + entry.getDepth() + " fullName: " + entry.getFullName());
                }

                onCompletion.onComplete(response);
            }
        });
        ApiHelper.execute(requestBuilder);
    }
}

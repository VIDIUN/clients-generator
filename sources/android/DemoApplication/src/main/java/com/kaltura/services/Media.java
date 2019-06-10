package com.vidiun.services;

import java.io.File;
import java.util.List;

import android.util.Log;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.enums.VidiunEntryType;
import com.vidiun.client.enums.VidiunMediaType;
import com.vidiun.client.services.VidiunMediaService;
import com.vidiun.client.types.VidiunBaseEntry;
import com.vidiun.client.types.VidiunFilterPager;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunMediaEntryFilter;
import com.vidiun.client.types.VidiunMediaListResponse;

/**
 * Media service lets you upload and manage media files (images / videos &
 * audio)
 */
public class Media {

    /**
     * Get a list of all media data from the vidiun server
     *
     * @param TAG constant in your class
     * @param mediaType Type of entries
     * @param pageSize The number of objects to retrieve. (Default is 30,
     * maximum page size is 500)
     *
     * @throws VidiunApiException
     */
    public static List<VidiunMediaEntry> listAllEntriesByIdCategories(String TAG, VidiunMediaEntryFilter filter, int pageIndex, int pageSize) throws VidiunApiException {
        // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        // create a new mediaService object for our client
        VidiunMediaService mediaService = client.getMediaService();

        // create a new pager to choose how many and which entries should be recieved
        // out of the filtered entries - not mandatory
        VidiunFilterPager pager = new VidiunFilterPager();
        pager.pageIndex = pageIndex;
        pager.pageSize = pageSize;

        // execute the list action of the mediaService object to recieve the list of entries
        VidiunMediaListResponse listResponse = mediaService.list(filter, pager);

        // loop through all entries in the reponse list and print their id.
        Log.w(TAG, "Entries list :");
        int i = 0;
        for (VidiunMediaEntry entry : listResponse.objects) {
            Log.w(TAG, ++i + " id:" + entry.id + " name:" + entry.name + " type:" + entry.type + " dataURL: " + entry.dataUrl);
        }
        return listResponse.objects;
    }

    /**
     * Get media entry by ID
     *
     * @param TAG constant in your class
     * @param entryId Media entry id
     *
     * @return Information about the entry
     *
     * @throws VidiunApiException
     */
    public static VidiunMediaEntry getEntrybyId(String TAG, String entryId) throws VidiunApiException {
        // create a new ADMIN-session client
        VidiunClient client = AdminUser.getClient();//RequestsVidiun.getVidiunClient();

        // create a new mediaService object for our client
        VidiunMediaService mediaService = client.getMediaService();
        VidiunMediaEntry entry = mediaService.get(entryId);
        Log.w(TAG, "Entry:");
        Log.w(TAG, " id:" + entry.id + " name:" + entry.name + " type:" + entry.type + " categories: " + entry.categories);
        return entry;
    }

    /**
     * Creates an empty media entry and assigns basic metadata to it.
     *
     * @param TAG constant in your class
     * @param category Category name which belongs to an entry
     * @param name Name of an entry
     * @param description Description of an entry
     * @param tag Tag of an entry
     *
     * @return Information about created the entry
     *
     *
     */
    public static VidiunMediaEntry addEmptyEntry(String TAG, String category, String name, String description, String tag) {

        try {
            VidiunClient client = AdminUser.getClient();

            Log.w(TAG, "\nCreating an empty Vidiun Entry (without actual media binary attached)...");

            VidiunMediaEntry entry = new VidiunMediaEntry();
            entry.mediaType = VidiunMediaType.VIDEO;
            entry.categories = category;
            entry.name = name;
            entry.description = description;
            entry.tags = tag;

            VidiunMediaEntry newEntry = client.getMediaService().add(entry);
            Log.w(TAG, "\nThe id of our new Video Entry is: " + newEntry.id);
            return newEntry;
        } catch (VidiunApiException e) {
            e.printStackTrace();
            Log.w(TAG, "err: " + e.getMessage());
            return null;
        }
    }

    /**
     * Create an entry
     *
     * @param TAG constant in your class
     * @param String fileName File to upload.
     * @param String entryName Name for the new entry.
     *
     * @throws VidiunApiException
     */
    public static void addEntry(String TAG, String fileName, String entryName) throws VidiunApiException {
        // create a new USER-session client
        VidiunClient client = AdminUser.getClient();

        // upload the new file and recieve the token that identifies it on the vidiun server
        File up = new File(fileName);
        String token = client.getBaseEntryService().upload(up);

        // create a new entry object with the required meta-data
        VidiunBaseEntry entry = new VidiunBaseEntry();
        entry.name = entryName;
        entry.categories = "Comedy";
        entry.type = VidiunEntryType.MEDIA_CLIP;

        // add the entry you created to the vidiun server, by attaching it with the uploaded file
        VidiunBaseEntry newEntry = client.getBaseEntryService().addFromUploadedFile(entry, token);

        // newEntry now contains the information of the new entry that was just created on the server
        Log.w(TAG, "New entry created successfuly with ID " + newEntry.id);
    }
}

package com.vidiun.mediatorActivity;

import android.app.Activity;
import android.os.Bundle;

import com.vidiun.activity.Info;
import com.vidiun.activity.Main;
import com.vidiun.activity.MostPopular;
import com.vidiun.activity.Player;
import com.vidiun.activity.Settings;
import com.vidiun.activity.Splash;
import com.vidiun.activity.SuccessUpload;
import com.vidiun.activity.Upload;
import com.vidiun.activity.Uploading;
import com.vidiun.activity.VideoCategories;
import com.vidiun.activity.VideoCategory;
import com.vidiun.activity.VideoInfo;

/**
 * Concrete mediator
 */
public class TemplateActivityMediator extends ActivityMediator {

    public TemplateActivityMediator(Activity activity) {
        super(activity);
    }

    public void showMain() {
        startActivity(Main.class);
    }

    public void showMostPopular() {
        startActivity(MostPopular.class);
    }

    public void showUpload() {
        startActivity(Upload.class);
    }

    public void showVideoCategories() {
        startActivity(VideoCategories.class);
    }

    public void showVideoCategories(boolean largeScreen) {
        Bundle bundle = new Bundle();
        bundle.putBoolean("largeScreen", largeScreen);
        startActivity(VideoCategories.class, bundle);
    }

    /**
     * Show Video Ctegory form
     *
     * @param categoryId Category id
     * @param categoryName Category name
	 *
     */
    public void showVideoCategory(int categoryId, String categoryName) {
        Bundle bundle = new Bundle();
        bundle.putInt("categoryId", categoryId);
        bundle.putString("categoryName", categoryName);
        startActivity(VideoCategory.class, bundle);
    }

    public void showSettings() {
        startActivity(Settings.class);
    }

    public void showPlayer() {
        startActivity(Player.class);
    }

    public void showPlayer(String entryId, String dataUrl, int duration, String url, int partnerId) {
        Bundle bundle = new Bundle();
        bundle.putString("entryId", entryId);
        bundle.putString("dataUrl", dataUrl);
        bundle.putInt("duration", duration);
        bundle.putString("url", url);
        bundle.putInt("partnerId", partnerId);
        startActivity(Player.class, bundle);
    }

    public void showSuccessUpload() {
        startActivity(SuccessUpload.class);
    }

    public void showUploading() {
        startActivity(Uploading.class);
    }

    public void showUploading(String pathfromURI, String category, String title, String description, String tags) {
        Bundle bundle = new Bundle();
        bundle.putString("pathfromURI", pathfromURI);
        bundle.putString("category", category);
        bundle.putString("title", title);
        bundle.putString("description", description);
        bundle.putString("tags", tags);
        startActivity(Uploading.class, bundle);
    }

    public void showVideoInfo() {
        startActivity(VideoInfo.class);
    }

    public void showVideoInfo(String pathfromURI) {
        Bundle bundle = new Bundle();
        bundle.putString("pathfromURI", pathfromURI);
        startActivity(VideoInfo.class, bundle);
    }

    public void showInfo() {
        startActivity(Info.class);
    }

    public void showInfo(String entryId, String nameCategory) {
        Bundle bundle = new Bundle();
        bundle.putString("entryId", entryId);
        bundle.putString("nameCategory", nameCategory);
        startActivity(Info.class, bundle);
    }

    public void showSplash() {
        startActivity(Splash.class);
    }

    public void showSplash(String mail, String password) {
        Bundle bundle = new Bundle();
        bundle.putString("mail", mail);
        bundle.putString("password", password);
        startActivity(Splash.class, bundle);
    }
    
    public void showFaceBook() {
    }
}

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.vidiun.activity.components;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.view.LayoutInflater;
import android.widget.LinearLayout;

import com.vidiun.activity.R;
import com.vidiun.client.types.VidiunMediaEntry;

/**
 *
 * @author sda
 */
public class GridForPort{
    
    private String TAG;
    private Activity activity;
    private LayoutInflater  inflater;
    private LinearLayout row_grid;
    private ItemGrid itemLeft;
    private ItemGrid itemRight;
    private int offset;
    private HashMap<VidiunMediaEntry, Bitmap> listBitmap;
    private List<VidiunMediaEntry> listKeys;
    
    
    public GridForPort(String TAG, Activity activity, int offset){
        this.TAG = TAG;
        this.activity = activity;
        
        inflater = (LayoutInflater)activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        row_grid = (LinearLayout)inflater.inflate(R.layout.row_grid, null);    
        
        itemLeft = new ItemGrid(TAG, row_grid, R.id.left_item);
        itemRight = new ItemGrid(TAG, row_grid, R.id.right_item);
        
        if(listBitmap != null){
            this.listBitmap = listBitmap;
        }else{
            this.listBitmap = new HashMap<VidiunMediaEntry, Bitmap>();
        }
        if(listKeys != null){
            this.listKeys = listKeys;
        }else{
            this.listKeys = new ArrayList<VidiunMediaEntry>();
        }
        this.offset = offset;
        
    }
    
    public LinearLayout getRowGrid(){
        return row_grid;
    }

    public ItemGrid getLeftItemGrid(){
        return itemLeft;
    }

    public ItemGrid getRightItemGrid(){
        return itemRight;
    }
    
    private void addContent() {
    }
    
    public int getOffset(){
        return offset;
    }
    
}

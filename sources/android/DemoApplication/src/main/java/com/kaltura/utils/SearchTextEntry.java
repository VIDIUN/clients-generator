package com.vidiun.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Observable;

import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.widget.EditText;

import com.vidiun.client.types.VidiunMediaEntry;

/**
 * Seeking a string entered in the search for the entry
 */
public class SearchTextEntry extends Observable implements TextWatcher {

    private int textlength;
    private List<VidiunMediaEntry> copyList;
    private List<VidiunMediaEntry> listCategory;
    private List<String> copyListInLowerCase;
    private EditText editText;
    private String TAG;

    public SearchTextEntry() {
    }

    public void init(String TAG, EditText editText, List<VidiunMediaEntry> listCategory) {
        this.TAG = TAG;
        this.editText = editText;
        this.listCategory = listCategory;
        textlength = 0;
        copyList = new ArrayList<VidiunMediaEntry>();
        copyListInLowerCase = new ArrayList<String>();
        copyList.addAll(listCategory);
        for (VidiunMediaEntry vidiunMediaEntry : listCategory) {
            copyListInLowerCase.add(vidiunMediaEntry.name.toLowerCase());
        }
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
        textlength = editText.getText().length();

        listCategory.clear();

        for (int i = 0; i < copyList.size(); i++) {
            Log.w(TAG, "search - str: " + copyList.get(i).name);
            //    Matcher m1 = p1.matcher(copyList.get(i).name);

            if (copyListInLowerCase.get(i).indexOf(editText.getText().toString().toLowerCase()) != -1) {
                // Log.w(TAG, "search - res: " + m1.group(1));
                listCategory.add(copyList.get(i));
            } else {
                Log.w(TAG, "search - not found");
            }
        }
        setChanged();
        notifyObservers(listCategory);
    }

    @Override
    public void afterTextChanged(Editable s) {
    }
}

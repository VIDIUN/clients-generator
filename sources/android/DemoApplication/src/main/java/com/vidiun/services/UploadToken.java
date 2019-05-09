/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.vidiun.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Observable;
import java.util.logging.Level;
import java.util.logging.Logger;

import android.os.Environment;
import android.util.Log;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.types.VidiunMediaEntry;
import com.vidiun.client.types.VidiunUploadToken;
import com.vidiun.client.types.VidiunUploadedFileTokenResource;

/**
 * Upload files to the server
 */
public class UploadToken extends Observable {
    
    private String TAG;
    private File fileData;
    private VidiunUploadToken vidiunUploadToken;
    private VidiunClient client;
    private int setAttemptUpload;
    private VidiunMediaEntry newEntry;
    private double remainingUploadFileSize;
    private boolean startUpload;
    private int readSum = 0;
    
    /**
     * Constructor Description of UploadToken
     *
     * @param TAG constant in your class
     * @param setAttemptUpload quantity attempts upload to the server
     */
    public UploadToken(String TAG, int setAttemptUpload) {
        this.TAG = TAG;
        fileData = new File(TAG);
        this.setAttemptUpload = setAttemptUpload;
        vidiunUploadToken = new VidiunUploadToken();
        remainingUploadFileSize = vidiunUploadToken.uploadedFileSize;
        client = AdminUser.getClient();
        
    }
    
    /**
     * Get size uploading file in percent
     *
     * @return size uploading file in percent
     */
    public int getUploadedFileSize() {
        int res = 0;
        try {
            res = (int) (vidiunUploadToken.uploadedFileSize / fileData.length() * 100.0);
        } catch (ArithmeticException e) {
            e.printStackTrace();
            Log.w(TAG, e);
            res = 0;
        }
        return res;
    }
    
    public void setStartUpload(boolean startUpload) {
        this.startUpload = startUpload;
    }
    
    /**
     * uploads a video file to Vidiun and assigns it to a given Media Entry
     * object
     *
     * @param TAG constant in your class
     * @param entry Entry to which is attached to the file
     * @param pathfromURI File path on local storage
     *
     * @return true - file uploaded; false - file not uploaded
     *
     */
    public boolean uploadMediaFileAndAttachToEmptyEntry(String TAG, VidiunMediaEntry entry, String pathfromURI) {
        Log.w(TAG, "\nUploading a video file...");
        readSum = 0;
        fileData = new File(pathfromURI);
        
        VidiunUploadToken upToken = null;
        try {
            upToken = client.getUploadTokenService().add();
        } catch (VidiunApiException ex) {
            Logger.getLogger(UploadToken.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        int sizeBuf = 1024 * 1000;
        byte buf[] = new byte[sizeBuf];
        int numRead = -1;
        String PATH = Environment.getExternalStorageDirectory() + "/download/";
        File outFile = null;
        FileOutputStream fos = null;
        FileInputStream fis = null;
        boolean uploaded = false;
        try {
            fis = new FileInputStream(pathfromURI);
        } catch (FileNotFoundException ex) {
            Log.w(TAG, "err: ", ex);
        }
        int i = 0;
        boolean errUpload = false;
        Log.w(TAG, "HASH:" + Float.valueOf(fileData.length()).hashCode());
        int attemptUpload = 0;
        
        boolean wasFirst = false;
        do {
            if (!errUpload) {
                try {
                    Log.w(TAG, "Available bytes: " + fis.available());
                    remainingUploadFileSize = fis.available();
                    if(remainingUploadFileSize == 0){
                        uploaded = true;
                        break;
                    }
                    buf = new byte[sizeBuf];
                    numRead = fis.read(buf);
                    Log.w(TAG, "Readed bytes: " + numRead);
                    outFile = new File(PATH, "upload.dat");
                    fos = new FileOutputStream(outFile);
                    fos.write(buf, 0, numRead);
                    fos.close();
                } catch (IOException ex) {
                    Log.w(TAG, "err: ", ex);
                }
            } else {
                attemptUpload++;
                Log.w(TAG, "upload error chunk: attemptUpload - " + attemptUpload);
                if (attemptUpload >= setAttemptUpload) {
                    Log.w(TAG, "---");
                }
                
            }
            if (fileData.length() > sizeBuf) {
                if (remainingUploadFileSize > sizeBuf) {
                    if (addChunk(client, upToken.id, outFile, readSum != 0, false, readSum)) {
                        Log.w(TAG, "1 chunk[" + ++i + "] - uploaddFileSize: " + vidiunUploadToken.uploadedFileSize);
                        wasFirst = true;
                        readSum += numRead;
                    } else {
                        Log.w(TAG, "error loading chunk!");
                        errUpload = true;
                    }
                } else {
                    if (addChunk(client, upToken.id, outFile, true, true, readSum)) {
                        Log.w(TAG, "n chunk[" + ++i + "] - uploaddFileSize: " + vidiunUploadToken.uploadedFileSize);
                        readSum += numRead;
                        uploaded = true;
                    } else {
                        Log.w(TAG, "error loading chunk!");
                        errUpload = true;
                    }
                }
            } else {
                Log.w(TAG, "was:" + wasFirst);
                if (wasFirst) {
                    if (addChunk(client, upToken.id, outFile, true, true, -1)) {
                        Log.w(TAG, "l chunk[" + ++i + "] - uploaddFileSize: " + vidiunUploadToken.uploadedFileSize);
                        uploaded = true;
                        wasFirst = false;
                    } else {
                        Log.w(TAG, "error loading chunk!");
                        errUpload = true;
                    }
                } else {
                    if (addChunk(client, upToken.id, outFile, false, true, -1)) {
                        Log.w(TAG, "n chunk[" + ++i + "] - uploaddFileSize: " + vidiunUploadToken.uploadedFileSize);
                        uploaded = true;
                        wasFirst = false;
                    } else {
                        Log.w(TAG, "error loading chunk!");
                        errUpload = true;
                    }
                }
            }
            setChanged();
            notifyObservers(getUploadedFileSize());
        } while (!uploaded && !(attemptUpload >= setAttemptUpload) && startUpload);
        
        Log.w(TAG, "HASH:" + Double.valueOf(vidiunUploadToken.uploadedFileSize).hashCode());
        if (uploaded) {
            startUpload = false;
            try {
                VidiunUploadedFileTokenResource fileTokenResource = new VidiunUploadedFileTokenResource();
                fileTokenResource.token = upToken.id;
                newEntry = client.getMediaService().addContent(entry.id, fileTokenResource);
                
                Log.w(TAG, "\nUploaded a new Video file to entry: " + newEntry.id);
            } catch (VidiunApiException e) {
                e.printStackTrace();
                Log.w(TAG, "err: " + e.getMessage());
            }
        } else {
            uploaded = false;
        }
        try {
            fis.close();
            fos.close();
        } catch (IOException ex) {
            Log.w(TAG, "err: ", ex);
        }
        return uploaded;
    }
    
    /**
     * @param VidiunClient client
     * @param String uploadTokenId
     * @param File outFile
     * @param int i
     *
     * @return
     */
    private boolean addChunk(VidiunClient client, String uploadTokenId, File outFile, boolean resume, boolean finalChunk, int resumeAt) {
        boolean isUploaded = false;
        try {
            vidiunUploadToken = client.getUploadTokenService().upload(uploadTokenId, outFile, resume, finalChunk, resumeAt);
            outFile.delete();
            isUploaded = true;
        } catch (VidiunApiException e) {
            e.printStackTrace();
            isUploaded = false;
            Log.w(TAG, "err: " + e.getMessage());
        }
        return isUploaded;
    }
}

package com.vidiun.services;

//<editor-fold defaultstate="collapsed" desc="comment">
import android.os.Handler;
import android.util.Log;

import com.vidiun.client.VidiunApiException;
import com.vidiun.client.VidiunClient;
import com.vidiun.client.VidiunConfiguration;
import com.vidiun.client.services.VidiunAdminUserService;
//</editor-fold>

/**
 * Manage details for the administrative user
 *
 */
public class AdminUser {

    private static VidiunClient client;
    private static boolean userIsLogin;
    /**
     * Contains the session if the user has successfully logged
     */
    public static String vs;
    /**
     * 
     * api host
     */
    public static String host;
    
    public static String cdnHost;

    /**
     *
     */
    public static VidiunClient getClient() {
        return client;
    }

    /**
     */
    public static boolean userIsLogin() {
        return userIsLogin;
    }

    /**
     * Get an admin session using admin email and password (Used for login to
     * the VMC application)
     *
     * @param TAG constant in your class
     * @param email
     * @param password
     *
     * @throws VidiunApiException
     */
    public static void login(final String TAG, final String email, final String password, final LoginTaskListener loginTaskListener) {
        final Handler handler = new Handler();
        Runnable runnable = new Runnable() {

            @Override
            public void run() {
                try {
                    // set a new configuration object
                    VidiunConfiguration config = new VidiunConfiguration();
                    config.setTimeout(10000);
                    config.setEndpoint(host);

                    client = new VidiunClient(config);

                    VidiunAdminUserService userService = new VidiunAdminUserService(client);
                    vs = userService.login(email, password);
                    Log.w(TAG, vs);
                    // set the vidiun client to use the recieved vs as default for all future operations
                    client.setSessionId(vs);
                    userIsLogin = true;
                    handler.post(new Runnable() {

                        @Override
                        public void run() {
                            loginTaskListener.onLoginSuccess();
                        }
                    });
                } catch (final VidiunApiException e) {
                    e.printStackTrace();
                    Log.w(TAG, "Login error: " + e.getMessage() + " error code: " + e.code);
                    userIsLogin = false;
                    handler.post(new Runnable() {

                        @Override
                        public void run() {
                            loginTaskListener.onLoginError(e.getMessage());
                        }
                    });
                }
            }
        };
        new Thread(runnable).start();
    }

    public interface LoginTaskListener {

        void onLoginSuccess();

        void onLoginError(String errorMessage);
    }
}

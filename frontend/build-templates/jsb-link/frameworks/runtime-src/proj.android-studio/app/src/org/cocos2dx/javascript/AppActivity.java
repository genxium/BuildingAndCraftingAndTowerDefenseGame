/****************************************************************************
Copyright (c) 2015-2016 Chukong Technologies Inc.
Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package org.cocos2dx.javascript;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Log;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.cocos2dx.lib.BuildConfig;
import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import java.util.Arrays;
import java.util.Formatter;
import java.util.List;
import java.util.Locale;

public class AppActivity extends Cocos2dxActivity {

    public static int REQ_CODE_SIGN_IN = 999999;

    private String vidAdUnit = null;

    public static void runJsCodeInGLThread(final String jsCode) {
        AppActivity.getApp().runOnGLThread(new Runnable() {
            @Override
            public void run() {
                /**
                 [WARNING]

                 Not running JSCode in the GLThread will crash.

                 -- YFLu, 2019-11-15.
                 */
                Cocos2dxJavascriptJavaBridge.evalString(jsCode);
            }
        });
    }

    private RewardedAd rewardedAd = null;
    public RewardedAd getRewardedAd() {
        return rewardedAd;
    }
    public void setRewardedAd(final RewardedAd newRewardedAd) {
        rewardedAd = newRewardedAd;
    }

    private static AppActivity app = null;
    public static AppActivity getApp() {
        return app;
    }

    public RewardedAd createAndLoadRewardedAd() {
        /***
         * RewardedAd is a one-time-use object. This means that once a rewarded ad is shown, the object can't be used to load another ad. To request another rewarded ad, you'll need to create a new RewardedAd object.
         *
         * Reference https://developers.google.com/admob/android/rewarded-ads.
         */
         final RewardedAd rewardedAd = new RewardedAd(SDKWrapper.getInstance().getContext(),
                vidAdUnit);

        final RewardedAdLoadCallback vidAdLoadCb = new RewardedAdLoadCallback() {
            @Override
            public void onRewardedAdLoaded() {
                // Ad successfully loaded.
                Log.w("vidAdLoadCb", "onRewardedAdLoaded");
            }

            @Override
            public void onRewardedAdFailedToLoad(int errorCode) {
                // ErrorCode enums reference https://developers.google.com/android/reference/com/google/android/gms/ads/AdRequest#ERROR_CODE_INTERNAL_ERROR.
                Log.w("vidAdLoadCb", "onRewardedAdFailedToLoad: " + errorCode);
                AppActivity.runJsCodeInGLThread("window.admobOnRewardedAdFailedToLoad(" + errorCode + ");");
            }
        };
        rewardedAd.loadAd(new AdRequest.Builder().build(), vidAdLoadCb);
        return rewardedAd;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Workaround in https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            // Android launched another instance of the root activity into an existing task
            //  so just quietly finish and go away, dropping the user back into the activity
            //  at the top of the stack (ie: the last state of this task)
            // Don't need to finish it again since it's finished in super.onCreate .
            return;
        }
        app = this;

        // DO OTHER INITIALIZATION BELOW
        SDKWrapper.getInstance().init(this);

        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                vidAdUnit = "ca-app-pub-9040110481200574/6724687650";

                if (BuildConfig.DEBUG) {
                    // Reference https://developers.google.com/admob/android/test-ads#sample_ad_units.
                    vidAdUnit = "ca-app-pub-3940256099942544/5224354917";
                    Log.w("BuildConfig.DEBUG", "vidAdUnit == " + vidAdUnit);

                    // Reference https://developers.google.com/admob/android/test-ads#enable_test_devices.
                    final String testDeviceId = "52BD7A4D27CCBB378DA6907ACAAFE663";

                    final StringBuilder sb = new StringBuilder();
                    final Formatter formatter = new Formatter(sb, Locale.US);
                    /**
                     * You might still see the log of
                     * ```
                     *  Use AdRequest.Builder.addTestDevice("52BD7A4D27CCBB378DA6907ACAAFE663") to get test ads on this device
                     * ```
                     * from logcat, but as long as you also see the following "toPrint" printed it's OK.
                     */
                    final String toPrint = formatter.format("Adding testDeviceId == %s", testDeviceId).toString();
                    Log.w("BuildConfig.DEBUG", toPrint);
                    List<String> testDeviceIds = Arrays.asList(testDeviceId);
                    RequestConfiguration configuration =
                            new RequestConfiguration.Builder().setTestDeviceIds(testDeviceIds).build();
                    MobileAds.setRequestConfiguration(configuration);
                }

                rewardedAd = createAndLoadRewardedAd();
            }
        });
    }
    
    @Override
    public Cocos2dxGLSurfaceView onCreateView() {
        Cocos2dxGLSurfaceView glSurfaceView = new Cocos2dxGLSurfaceView(this);
        // TestCpp should create stencil buffer
        glSurfaceView.setEGLConfigChooser(5, 6, 5, 0, 16, 8);
        SDKWrapper.getInstance().setGLSurfaceView(glSurfaceView, this);

        return glSurfaceView;
    }

    @Override
    protected void onResume() {
        super.onResume();
        SDKWrapper.getInstance().onResume();

    }

    @Override
    protected void onPause() {
        super.onPause();
        SDKWrapper.getInstance().onPause();

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        SDKWrapper.getInstance().onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        SDKWrapper.getInstance().onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInClient.getSignInIntent(...);
        if (requestCode == REQ_CODE_SIGN_IN) {
            // The Task returned from this call is always completed, no need to attach
            // a listener.
            final Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            Log.w("onActivityResult", "Got a requestCode == REQ_CODE_SIGN_IN.");

            try {
                final GoogleSignInAccount account = task.getResult(ApiException.class);
                final String id = account.getId();
                final String idToken = account.getIdToken();
                Log.w("onActivityResult", "Signed in with Google account, id == " + id + ", idToken == " + idToken);

                final StringBuilder sb = new StringBuilder();
                final Formatter formatter = new Formatter(sb, Locale.US);

                final String toCallJsStr = formatter.format("window.onLoggedInByGoogle('%s', '%s', null);", id, idToken).toString();
                runJsCodeInGLThread(toCallJsStr);
            } catch (ApiException e) {
                // The ApiException status code indicates the detailed failure reason.
                // Please refer to the GoogleSignInStatusCodes class reference for more information.

                // https://developers.google.com/android/reference/com/google/android/gms/auth/api/signin/GoogleSignInStatusCodes
                Log.w("onActivityResult", "signInResult:failed code=" + e.getStatusCode());
                runJsCodeInGLThread("window.onLoggedInByGoogle(null, null, " + e.getStatusCode() + ");");
            } catch (NullPointerException e) {
                Log.w("onActivityResult", "NullPointerException");
                runJsCodeInGLThread("window.onLoggedInByGoogle(null, null, null);");
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SDKWrapper.getInstance().onNewIntent(intent);
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        SDKWrapper.getInstance().onRestart();
    }

    @Override
    protected void onStop() {
        super.onStop();
        SDKWrapper.getInstance().onStop();
    }
        
    @Override
    public void onBackPressed() {
        SDKWrapper.getInstance().onBackPressed();
        super.onBackPressed();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        SDKWrapper.getInstance().onConfigurationChanged(newConfig);
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        SDKWrapper.getInstance().onRestoreInstanceState(savedInstanceState);
        super.onRestoreInstanceState(savedInstanceState);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        SDKWrapper.getInstance().onSaveInstanceState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStart() {
        SDKWrapper.getInstance().onStart();
        super.onStart();
    }
}

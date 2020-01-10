package org.cocos2dx.javascript.authpayment;


import android.content.Intent;
import android.os.Handler;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdCallback;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;

import org.cocos2dx.javascript.AppActivity;

import java.util.Formatter;
import java.util.Locale;

public class ApHelper {
    public static void signInByGoogle() {
        // Reference https://developers.google.com/identity/sign-in/android/sign-in

        /*
        Deliberately dispatched to run in the MainThread, as it's implied in the official doc above.
        
        -- YFLu, 2019-11-18.
        */
        final Handler mainHandler = new Handler(AppActivity.getApp().getMainLooper());

        final Runnable vidAdReloadRunnable = new Runnable() {
            @Override
            public void run() {
              // Configure sign-in to request the user's ID, email address, and basic
              // profile. ID and basic profile are included in DEFAULT_SIGN_IN.

                final String ggApiClientId = "948416954294-tg7imgfb09kruk7essrlnaa0d6jmghsn.apps.googleusercontent.com";
                final GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestId()
                        .requestIdToken(ggApiClientId)
                        //.requestServerAuthCode(ggApiClientId) // No, we don't need a proxied access to the player's Google account info from our backend.
                        .requestEmail()
                        .build();

              // Build a GoogleSignInClient with the options specified by gso.
              final GoogleSignInClient googleSignInClient = GoogleSignIn.getClient(AppActivity.getApp(), gso);
              
              // Check for existing Google Sign In account, if the user is already signed in
              // the GoogleSignInAccount will be non-null.
              final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(AppActivity.getApp());
              if (null == account) {
                Log.w("ApHelper", "There's no existing google account associated with this device.");
                final Intent signInIntent = googleSignInClient.getSignInIntent();
                  AppActivity.getApp().startActivityForResult(signInIntent, AppActivity.REQ_CODE_SIGN_IN);
              } else {
                  Log.w("ApHelper", "There's an existing google account associated with this device.");
                  try {
                      final String id = account.getId();
                      final String idToken = account.getIdToken();

                      Log.w("ApHelper", "Signed in with Google account, id == " + id + ", idToken == " + idToken);

                      final StringBuilder sb = new StringBuilder();
                      final Formatter formatter = new Formatter(sb, Locale.US);

                      final String toCallJsStr = formatter.format("window.onLoggedInByGoogle('%s', '%s', null);", id, idToken).toString();
                      AppActivity.runJsCodeInGLThread(toCallJsStr);
                  } catch (NullPointerException e) {
                      Log.w("onActivityResult", "NullPointerException");
                      AppActivity.runJsCodeInGLThread("window.onLoggedInByGoogle(null, null, null);");
                  }
              }
            }
        };
        mainHandler.post(vidAdReloadRunnable);
    }

    public static boolean isRewardedAppLoaded() {
        final RewardedAd rewardedAd = AppActivity.getApp().getRewardedAd();
        if (null == rewardedAd) return false;
        return rewardedAd.isLoaded();
    }

    public static void showRewardedVidAd() {
        final RewardedAd rewardedAd = AppActivity.getApp().getRewardedAd();
        if (null == rewardedAd) {
            return;
        }

        /**
         * You must make all calls to load ads in the "MainThread".
         *
         *  Reference https://developers.google.com/admob/android/rewarded-ads?hl=en-US#load_an_ad.
         *
         *  -- YFLu, 2019-11-15.
         */
        final Handler mainHandler = new Handler(AppActivity.getApp().getMainLooper());

        final Runnable vidAdReloadRunnable = new Runnable() {
            @Override
            public void run() {
                final RewardedAd newRewardedAd = AppActivity.getApp().createAndLoadRewardedAd();
                AppActivity.getApp().setRewardedAd(newRewardedAd);
            }
        };

        /**
        The display of vidad must be run on the UIThread.

        Reference http://docs.cocos.com/creator/manual/en/advanced-topics/java-reflection.html.

        -- YFLu, 2019-11-15.
         */
        AppActivity.getApp().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (rewardedAd.isLoaded()) {
                    final RewardedAdCallback adCallback = new RewardedAdCallback() {
                        @Override
                        public void onRewardedAdOpened() {
                            AppActivity.runJsCodeInGLThread("window.admobOnRewardedAdOpened();");
                        }

                        @Override
                        public void onRewardedAdClosed() {
                            AppActivity.runJsCodeInGLThread("window.admobOnRewardedAdClosed();");
                            mainHandler.post(vidAdReloadRunnable);
                        }

                        @Override
                        public void onUserEarnedReward(@NonNull RewardItem reward) {
                            // User earned reward.
                            Log.w("ApHelper", "onUserEarnedReward");
                            AppActivity.runJsCodeInGLThread("window.admobOnUserEarnedReward();");
                        }

                        @Override
                        public void onRewardedAdFailedToShow(int errorCode) {
                            AppActivity.runJsCodeInGLThread("window.admobOnRewardedAdFailedToShow();");
                        }
                    };
                    Log.w("LoadedVidAd", "rewardedAd already loaded, showing");
                    rewardedAd.show(AppActivity.getApp(), adCallback);
                } else {
                    Log.w("LoadedVidAd", "rewardedAd not yet loaded! -- now loading...");
                    mainHandler.post(vidAdReloadRunnable);
                    AppActivity.runJsCodeInGLThread("window.admobOnRewardedAdJustStartedLoading();");
                }
            }
        });
    }

    public static void echo(String msg){
        System.out.println(msg);
    }

    public static String strcat(String a, String b){
        return a + b;
    }
}

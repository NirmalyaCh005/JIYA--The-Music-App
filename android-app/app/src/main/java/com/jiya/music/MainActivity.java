package com.jiya.music;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private AudioManager audioManager;
    private AudioService audioService;
    private boolean isBound = false;
    private static final String APP_URL = "https://jiya-kappa.vercel.app";

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            AudioService.LocalBinder binder = (AudioService.LocalBinder) service;
            audioService = binder.getService();
            isBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            isBound = false;
            audioService = null;
        }
    };

    public class WebAppNativeInterface {
        @JavascriptInterface
        public void playNativeAudio(String streamUrl, String title, String artist) {
            runOnUiThread(() -> {
                if (isBound && audioService != null) {
                    audioService.playStreamUrl(streamUrl, title, artist);
                }
            });
        }

        @JavascriptInterface
        public void pauseNativeAudio() {
            runOnUiThread(() -> {
                if (isBound && audioService != null) {
                    audioService.pauseAudio();
                }
            });
        }

        @JavascriptInterface
        public void resumeNativeAudio() {
            runOnUiThread(() -> {
                if (isBound && audioService != null) {
                    audioService.resumeAudio();
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Bind Native Audio Service
        Intent intent = new Intent(this, AudioService.class);
        ContextCompat.startForegroundService(this, intent);
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        requestSystemAudioFocus();

        webView = findViewById(R.id.webview);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Add Javascript Bridge Interface for Native Android MediaPlayer
        webView.addJavascriptInterface(new WebAppNativeInterface(), "AndroidNativePlayer");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        }
    }

    private void requestSystemAudioFocus() {
        if (audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioFocusRequest focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(focusChange -> {})
                    .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(focusChange -> {}, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.resumeTimers();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (webView != null) {
            webView.resumeTimers();
        }
    }

    @Override
    protected void onDestroy() {
        if (isBound) {
            unbindService(serviceConnection);
            isBound = false;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

package com.avenbuild.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.res.AssetManager
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.MimeTypeMap
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updateLayoutParams
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.FileNotFoundException
import java.io.InputStream

/**
 * Hosts the AvenBuild web app in a WebView. The Vite build is bundled in assets/web/ and served from
 * https://appassets.androidplatform.net, so the app works offline, gets a secure origin (needed for
 * crypto.randomUUID) and keeps its localStorage data between launches.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var pageReady = false
    private val launchedAt = SystemClock.uptimeMillis()

    private var pendingFileCallback: ValueCallback<Array<Uri>>? = null
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data
        val uris = if (result.resultCode == Activity.RESULT_OK && data != null) {
            val clip = data.clipData
            when {
                clip != null -> Array(clip.itemCount) { clip.getItemAt(it).uri }
                data.data != null -> arrayOf(data.data!!)
                else -> null
            }
        } else {
            null
        }
        pendingFileCallback?.onReceiveValue(uris)
        pendingFileCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        // Hold the splash until the first page renders, but never longer than a few seconds.
        splash.setKeepOnScreenCondition { !pageReady && SystemClock.uptimeMillis() - launchedAt < SPLASH_TIMEOUT_MS }

        val paper = ContextCompat.getColor(this, R.color.paper)
        val surface = ContextCompat.getColor(this, R.color.surface)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(paper, paper),
            navigationBarStyle = SystemBarStyle.light(surface, surface),
        )

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        webView = WebView(this).apply {
            setBackgroundColor(paper)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.setSupportMultipleWindows(false)
            settings.userAgentString = "${settings.userAgentString} AvenBuildAndroid/${BuildConfig.VERSION_NAME}"
            webViewClient = AppWebViewClient()
            webChromeClient = AppChromeClient()
        }

        // The page sits between the system bars; the strip behind the navigation bar matches the web bottom nav.
        val navBarStrip = View(this).apply { setBackgroundColor(surface) }
        val root = FrameLayout(this).apply {
            setBackgroundColor(paper)
            addView(webView, FrameLayout.LayoutParams(MATCH, MATCH))
            addView(navBarStrip, FrameLayout.LayoutParams(MATCH, 0, Gravity.BOTTOM))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            webView.updateLayoutParams<ViewGroup.MarginLayoutParams> {
                setMargins(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            }
            navBarStrip.updateLayoutParams { height = bars.bottom }
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)

        onBackPressedDispatcher.addCallback(this, BackHandler())

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(START_URL)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        pendingFileCallback?.onReceiveValue(null)
        pendingFileCallback = null
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    /** Back closes an open web dialog first, then walks the in-app history, then leaves the app. */
    private inner class BackHandler : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            webView.evaluateJavascript(CLOSE_TOP_DIALOG_JS) { closed ->
                if (closed == "true") return@evaluateJavascript
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        }
    }

    private inner class AppWebViewClient : WebViewClientCompat() {
        private val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", SpaAssetHandler(assets))
            .build()

        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            assetLoader.shouldInterceptRequest(request.url)

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (request.url.host == APP_HOST) return false
            openExternally(request.url)
            return true
        }

        override fun onPageFinished(view: WebView, url: String?) {
            pageReady = true
        }

        override fun onRenderProcessGone(view: WebView, detail: android.webkit.RenderProcessGoneDetail): Boolean {
            // The renderer crashed or was reclaimed; rebuild the activity (data lives in localStorage).
            recreate()
            return true
        }
    }

    private inner class AppChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: FileChooserParams,
        ): Boolean {
            pendingFileCallback?.onReceiveValue(null)
            pendingFileCallback = callback
            val mimeTypes = params.acceptTypes
                .flatMap { it.split(',') }
                .map { it.trim() }
                .filter { it.isNotEmpty() }
                .map { if (it.startsWith('.')) MimeTypeMap.getSingleton().getMimeTypeFromExtension(it.drop(1)) ?: "*/*" else it }
                .distinct()
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = mimeTypes.singleOrNull() ?: "*/*"
                if (mimeTypes.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes.toTypedArray())
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
            }
            return try {
                filePicker.launch(intent)
                true
            } catch (e: ActivityNotFoundException) {
                pendingFileCallback = null
                Toast.makeText(this@MainActivity, R.string.no_file_picker, Toast.LENGTH_SHORT).show()
                false
            }
        }
    }

    private fun openExternally(uri: Uri) {
        val intent = when (uri.scheme) {
            "http", "https" -> Intent(Intent.ACTION_VIEW, uri)
            "mailto" -> Intent(Intent.ACTION_SENDTO, uri)
            "tel" -> Intent(Intent.ACTION_DIAL, uri)
            else -> return // intent:, javascript:, file: and other schemes are never handed off.
        }
        try {
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, R.string.no_app_for_link, Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Serves assets/web/ at the site root. Paths without a file extension are client-side routes
     * (React Router), so they get index.html, mirroring an SPA fallback on a web server.
     */
    private class SpaAssetHandler(private val assets: AssetManager) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse {
            val file = path.trim('/').ifEmpty { "index.html" }
            if (file.split('/').any { it == ".." }) return notFound()
            open(file)?.let { return WebResourceResponse(mimeType(file), null, it) }
            if ('.' !in file.substringAfterLast('/')) {
                open("index.html")?.let { return WebResourceResponse("text/html", "utf-8", it) }
            }
            return notFound()
        }

        private fun open(file: String): InputStream? = try {
            assets.open("web/$file")
        } catch (e: FileNotFoundException) {
            null
        }

        private fun notFound() = WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), null)

        private fun mimeType(file: String): String = when (file.substringAfterLast('.').lowercase()) {
            "html" -> "text/html"
            "js", "mjs" -> "text/javascript"
            "css" -> "text/css"
            "json", "map" -> "application/json"
            "svg" -> "image/svg+xml"
            "woff2" -> "font/woff2"
            "woff" -> "font/woff"
            "webmanifest" -> "application/manifest+json"
            else -> MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.substringAfterLast('.')) ?: "application/octet-stream"
        }
    }

    private companion object {
        const val APP_HOST = WebViewAssetLoader.DEFAULT_DOMAIN
        const val START_URL = "https://$APP_HOST/"
        const val SPLASH_TIMEOUT_MS = 4_000L
        const val MATCH = ViewGroup.LayoutParams.MATCH_PARENT

        /** Fires `cancel` on the top-most open <dialog>; the Dialog component turns that into onClose. */
        const val CLOSE_TOP_DIALOG_JS = """
            (function () {
              var open = document.querySelectorAll('dialog[open]');
              if (!open.length) return false;
              open[open.length - 1].dispatchEvent(new Event('cancel', { cancelable: true }));
              return true;
            })();
        """
    }
}

import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The web app lives one level above this Gradle project.
val webRoot: File = rootProject.projectDir.parentFile
val webDist: File = webRoot.resolve("dist")
val packageJsonVersion: String =
    Regex("\"version\"\\s*:\\s*\"([^\"]+)\"").find(webRoot.resolve("package.json").readText())?.groupValues?.get(1) ?: "0.0.0"

// Release signing is read from android/keystore.properties (git-ignored). Without it, release builds are unsigned.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.avenbuild.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.avenbuild.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = packageJsonVersion
    }

    signingConfigs {
        if (keystoreProps.isNotEmpty()) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}

/** Runs the Vite production build. Pass -PskipWebBuild to reuse an existing dist/ folder. */
val buildWeb by tasks.registering(Exec::class) {
    description = "Builds the AvenBuild web app (npm run build)."
    workingDir = webRoot
    val npm = if (System.getProperty("os.name").lowercase().contains("windows")) "npm.cmd" else "npm"
    commandLine(npm, "run", "build")
    onlyIf { !project.hasProperty("skipWebBuild") }
    inputs.dir(webRoot.resolve("src"))
    inputs.dir(webRoot.resolve("public"))
    inputs.files(
        webRoot.resolve("index.html"),
        webRoot.resolve("package.json"),
        webRoot.resolve("package-lock.json"),
        webRoot.resolve("vite.config.ts"),
    )
    outputs.dir(webDist)
}

/** Copies dist/ into a generated assets folder as assets/web/, which MainActivity serves. */
abstract class SyncWebAssets : DefaultTask() {
    @get:InputDirectory
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val distDir: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Inject
    abstract val fs: FileSystemOperations

    @TaskAction
    fun sync() {
        val dist = distDir.get().asFile
        check(dist.resolve("index.html").exists()) { "No web build found at $dist — run `npm run build` first." }
        fs.sync {
            from(dist)
            into(outputDir.dir("web"))
        }
    }
}

val syncWebAssets by tasks.registering(SyncWebAssets::class) {
    dependsOn(buildWeb)
    distDir.set(webDist)
    outputDir.set(layout.buildDirectory.dir("generated/webAssets"))
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(syncWebAssets, SyncWebAssets::outputDir)
    }
}

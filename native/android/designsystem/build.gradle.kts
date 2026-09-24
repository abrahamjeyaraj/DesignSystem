plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("maven-publish")
}

val dsVersion: String = (findProperty("dsVersion") as String?) ?: "0.0.0-SNAPSHOT"

android {
    namespace = "com.abrahamjeyaraj.designsystem"
    compileSdk = 35
    defaultConfig { minSdk = 26 }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.04.01"))
    api("androidx.compose.material3:material3")
    api("androidx.compose.ui:ui")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.compose.ui:ui-tooling-preview")
    testImplementation("junit:junit:4.13.2")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                groupId = "com.abrahamjeyaraj"
                artifactId = "designsystem"
                version = dsVersion
            }
        }
        repositories {
            maven {
                name = "GitHubPackages"
                url = uri("https://maven.pkg.github.com/abrahamjeyaraj/DesignSystem")
                credentials {
                    username = System.getenv("GITHUB_ACTOR") ?: ""
                    password = System.getenv("GITHUB_TOKEN") ?: ""
                }
            }
        }
    }
}

// Never publish a default SNAPSHOT to GitHub Packages (v0.2.0 shipped as 0.0.0-SNAPSHOT because the
// workflow passed the wrong property name).
tasks.matching { it.name.startsWith("publish") && it.name.endsWith("ToGitHubPackagesRepository") }.configureEach {
    doFirst {
        require(!dsVersion.endsWith("SNAPSHOT")) { "Refusing to publish $dsVersion: pass -PdsVersion=<x.y.z>" }
    }
}

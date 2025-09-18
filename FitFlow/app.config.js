import "dotenv/config";

export default {
  expo: {
    name: "FitFlow",
    slug: "FitFlow",
    plugins: [
      "expo-font",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/fitflow.png",
    scheme: "fitflow",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.fitflow",
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["fitflow"]
          }
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.yourcompany.fitflow",
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "fitflow",
              host: "login-callback"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png"
    },
    platforms: ["ios", "android", "web"],
    assetBundlePatterns: ["**/*"],
    experiments: {
      typedRoutes: false
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      OPENAI_KEY: process.env.OPENAI_KEY,
      APP_ENV: process.env.APP_ENV || "development",
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID || undefined
    }
  }
};
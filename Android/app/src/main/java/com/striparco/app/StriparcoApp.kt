package com.striparco.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import androidx.appcompat.app.AppCompatDelegate
import java.util.Locale

class StriparcoApp : Application() {

    override fun onCreate() {
        super.onCreate()
        Config.init(this)
        applyTheme(Config.theme)
        createChannels()
    }

    /** Force the user's chosen locale regardless of the system one (bilingual HU/EN). */
    override fun attachBaseContext(base: Context) {
        Config.init(base)
        super.attachBaseContext(wrapLocale(base, Config.lang))
    }

    private fun createChannels() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(CH_SERVICE, "STRIPARCO", NotificationManager.IMPORTANCE_LOW)
            )
            nm.createNotificationChannel(
                NotificationChannel(CH_ALERT, "STRIPARCO", NotificationManager.IMPORTANCE_HIGH)
            )
        }
    }

    companion object {
        const val CH_SERVICE = "striparco_service"
        const val CH_ALERT = "striparco_alert"

        fun applyTheme(theme: String) {
            AppCompatDelegate.setDefaultNightMode(
                when (theme) {
                    "light" -> AppCompatDelegate.MODE_NIGHT_NO
                    "dark" -> AppCompatDelegate.MODE_NIGHT_YES
                    else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                }
            )
        }

        fun wrapLocale(ctx: Context, lang: String): Context {
            val locale = Locale(if (lang == "en") "en" else "hu")
            Locale.setDefault(locale)
            val cfg = Configuration(ctx.resources.configuration)
            cfg.setLocale(locale)
            return ctx.createConfigurationContext(cfg)
        }
    }
}

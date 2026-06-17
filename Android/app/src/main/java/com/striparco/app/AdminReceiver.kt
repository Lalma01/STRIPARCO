package com.striparco.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/**
 * Device-admin anti-tamper. While the password is set, enabling this admin blocks uninstalling
 * the app from Settings — the Android counterpart of preventUninstallation() on Windows.
 * The user can still disable it from Security settings if they know the password flow.
 */
class AdminReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return context.getString(R.string.admin_disable_warning)
    }
}

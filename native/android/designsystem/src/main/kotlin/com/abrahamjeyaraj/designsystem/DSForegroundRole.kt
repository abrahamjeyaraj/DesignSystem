package com.abrahamjeyaraj.designsystem

import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

/** Resolved foreground colour from the active theme palette for nested composition locals. */
object DSForegroundRole {
    @Composable
    fun color(selector: DSColorScheme.() -> Long): Color = Color(selector(DS.current.colors))

    @Composable
    fun Provide(selector: DSColorScheme.() -> Long, content: @Composable () -> Unit) {
        CompositionLocalProvider(LocalContentColor provides color(selector), content = content)
    }
}

package com.abe.design

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Active theme plus resolved colours, for roles Material has no slot for (ink, subtle, line, action, status). */
@Immutable
data class AbeDesign(val tokens: AbeThemeTokens, val colors: AbeColorScheme, val dark: Boolean) {
    fun color(argb: Long) = Color(argb)
    fun extra(name: String): Color? = (if (dark) tokens.extraDark else tokens.extraLight)[name]?.let(::Color)
}

val LocalAbeDesign = staticCompositionLocalOf { AbeDesign(AbeTokens.bible, AbeTokens.bible.light, false) }

object Abe {
    val current: AbeDesign
        @Composable @ReadOnlyComposable get() = LocalAbeDesign.current
}

/**
 * Wrap the app root: `AbeTheme(AbeTokens.church) { ... }`.
 * Custom font families are resolved by [fonts]; pass the app's bundled FontFamily per token family name.
 */
@Composable
fun AbeTheme(
    theme: AbeThemeTokens,
    dark: Boolean = isSystemInDarkTheme(),
    fonts: (String) -> FontFamily = { FontFamily.Default },
    content: @Composable () -> Unit,
) {
    val c = theme.colors(dark)
    val material = if (dark) {
        darkColorScheme(
            primary = Color(c.primary), onPrimary = Color(c.primaryForeground),
            secondary = Color(c.accent), onSecondary = Color(c.accentForeground),
            background = Color(c.background), onBackground = Color(c.foreground),
            surface = Color(c.card), onSurface = Color(c.cardForeground),
            surfaceVariant = Color(c.muted), onSurfaceVariant = Color(c.mutedForeground),
            error = Color(c.destructive), onError = Color(c.destructiveForeground),
            outline = Color(c.border),
        )
    } else {
        lightColorScheme(
            primary = Color(c.primary), onPrimary = Color(c.primaryForeground),
            secondary = Color(c.accent), onSecondary = Color(c.accentForeground),
            background = Color(c.background), onBackground = Color(c.foreground),
            surface = Color(c.card), onSurface = Color(c.cardForeground),
            surfaceVariant = Color(c.muted), onSurfaceVariant = Color(c.mutedForeground),
            error = Color(c.destructive), onError = Color(c.destructiveForeground),
            outline = Color(c.border),
        )
    }
    val body = fonts(theme.fontFamily.body)
    val heading = fonts(theme.fontFamily.heading)
    val label = theme.label
    val typography = Typography(
        headlineMedium = TextStyle(fontFamily = heading, fontSize = theme.fontSize.xl2.sp, fontWeight = FontWeight.Bold),
        titleLarge = TextStyle(fontFamily = heading, fontSize = theme.fontSize.xl.sp, fontWeight = FontWeight.SemiBold),
        bodyMedium = TextStyle(fontFamily = body, fontSize = theme.fontSize.base.sp),
        bodySmall = TextStyle(fontFamily = body, fontSize = theme.fontSize.sm.sp),
        labelLarge = TextStyle(
            fontFamily = fonts(theme.fontFamily.label),
            fontSize = label.size.sp,
            fontWeight = FontWeight(label.weight),
            letterSpacing = label.tracking.sp,
        ),
    )
    val shapes = Shapes(
        small = RoundedCornerShape(theme.radius.control.dp),
        medium = RoundedCornerShape(theme.radius.card.dp),
        large = RoundedCornerShape(theme.radius.xl.dp),
    )
    CompositionLocalProvider(LocalAbeDesign provides AbeDesign(theme, c, dark)) {
        MaterialTheme(colorScheme = material, typography = typography, shapes = shapes, content = content)
    }
}

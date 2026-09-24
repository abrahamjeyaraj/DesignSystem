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

/** Returns bundled [FontFamily] for [familyName], or null to use role-based fallbacks. */
typealias AbeFontFamilyResolver = (familyName: String) -> FontFamily?

private val DefaultAbeFontResolver: AbeFontFamilyResolver = { null }

/** Active theme plus resolved colours for roles Material has no slot for (ink, subtle, line, action, status). */
@Immutable
data class AbeDesign(
    val tokens: AbeThemeTokens,
    val colors: AbeColorScheme,
    /** Whether the light or dark palette is active (respects [AbeThemeTokens.supportsDark]). */
    val dark: Boolean,
    val typography: AbeMobileTypography,
) {
    fun color(argb: Long): Color = Color(argb)

    fun extra(name: String): Color? = (if (dark) tokens.extraDark else tokens.extraLight)[name]?.let(::Color)
}

@Immutable
data class AbeMobileTypography(
    val title: TextStyle,
    val headline: TextStyle,
    val body: TextStyle,
    val label: TextStyle,
    val caption: TextStyle,
)

val LocalAbeDesign = staticCompositionLocalOf {
    AbeDesign(
        tokens = AbeTokens.bible,
        colors = AbeTokens.bible.light,
        dark = false,
        typography = buildMobileTypography(AbeTokens.bible, DefaultAbeFontResolver),
    )
}

object Abe {
    val current: AbeDesign
        @Composable
        @ReadOnlyComposable
        get() = LocalAbeDesign.current
}

/** When [supportsDark] is false, always use the light palette even if the OS is dark. */
fun AbeThemeTokens.effectiveDark(systemDark: Boolean): Boolean = supportsDark && systemDark

fun AbeFontFamilyResolver.resolve(family: String, headingRole: Boolean): FontFamily =
    this(family) ?: if (headingRole) FontFamily.Serif else FontFamily.Default

internal fun buildMobileTypography(tokens: AbeThemeTokens, fonts: AbeFontFamilyResolver): AbeMobileTypography {
    fun roleStyle(role: AbeTextRole, heading: Boolean): TextStyle =
        TextStyle(
            fontFamily = fonts.resolve(role.family, heading),
            fontSize = role.size.sp,
            lineHeight = role.lineHeight.sp,
            fontWeight = FontWeight(role.weight),
        )
    val mt = tokens.mobileType
    return AbeMobileTypography(
        title = roleStyle(mt.title, heading = true),
        headline = roleStyle(mt.headline, heading = true),
        body = roleStyle(mt.body, heading = false),
        label = roleStyle(mt.label, heading = false),
        caption = roleStyle(mt.caption, heading = false),
    )
}

/**
 * Wrap the app root: `AbeTheme(AbeTokens.church) { ... }`.
 * Pass [fonts] to map theme family names to app-bundled [FontFamily]; unresolved names fall back to
 * serif (title/headline roles) or the platform default sans (body, label, caption).
 */
@Composable
fun AbeTheme(
    theme: AbeThemeTokens,
    dark: Boolean = isSystemInDarkTheme(),
    fonts: AbeFontFamilyResolver = DefaultAbeFontResolver,
    content: @Composable () -> Unit,
) {
    val useDark = theme.effectiveDark(dark)
    val c = theme.colors(useDark)
    val mobileTypography = buildMobileTypography(theme, fonts)
    val material = if (useDark) {
        darkColorScheme(
            primary = Color(c.primary),
            onPrimary = Color(c.primaryForeground),
            secondary = Color(c.accent),
            onSecondary = Color(c.accentForeground),
            background = Color(c.background),
            onBackground = Color(c.foreground),
            surface = Color(c.card),
            onSurface = Color(c.cardForeground),
            surfaceVariant = Color(c.muted),
            onSurfaceVariant = Color(c.mutedForeground),
            error = Color(c.destructive),
            onError = Color(c.destructiveForeground),
            outline = Color(c.border),
        )
    } else {
        lightColorScheme(
            primary = Color(c.primary),
            onPrimary = Color(c.primaryForeground),
            secondary = Color(c.accent),
            onSecondary = Color(c.accentForeground),
            background = Color(c.background),
            onBackground = Color(c.foreground),
            surface = Color(c.card),
            onSurface = Color(c.cardForeground),
            surfaceVariant = Color(c.muted),
            onSurfaceVariant = Color(c.mutedForeground),
            error = Color(c.destructive),
            onError = Color(c.destructiveForeground),
            outline = Color(c.border),
        )
    }
    val label = theme.label
    val labelFamily = fonts.resolve(theme.fontFamily.label, headingRole = false)
    val typography = Typography(
        headlineMedium = mobileTypography.headline,
        titleLarge = mobileTypography.title,
        bodyMedium = mobileTypography.body,
        bodySmall = mobileTypography.caption,
        labelLarge = TextStyle(
            fontFamily = labelFamily,
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
    CompositionLocalProvider(
        LocalAbeDesign provides AbeDesign(theme, c, useDark, mobileTypography),
    ) {
        MaterialTheme(colorScheme = material, typography = typography, shapes = shapes, content = content)
    }
}

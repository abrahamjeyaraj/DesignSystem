package com.abrahamjeyaraj.designsystem

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
typealias DSFontFamilyResolver = (familyName: String) -> FontFamily?

private val DefaultDSFontResolver: DSFontFamilyResolver = { null }

/** Active theme plus resolved colours for roles Material has no slot for (ink, subtle, line, action, status). */
@Immutable
data class DesignSystem(
    val tokens: DSThemeTokens,
    val colors: DSColorScheme,
    /** Whether the light or dark palette is active (respects [DSThemeTokens.supportsDark]). */
    val dark: Boolean,
    val typography: DSMobileTypography,
) {
    fun color(argb: Long): Color = Color(argb)

    fun extra(name: String): Color? = (if (dark) tokens.extraDark else tokens.extraLight)[name]?.let(::Color)
}

@Immutable
data class DSMobileTypography(
    val title: TextStyle,
    val headline: TextStyle,
    val body: TextStyle,
    val label: TextStyle,
    val caption: TextStyle,
)

val LocalDesignSystem = staticCompositionLocalOf {
    DesignSystem(
        tokens = DSTokens.bible,
        colors = DSTokens.bible.light,
        dark = false,
        typography = buildMobileTypography(DSTokens.bible, DefaultDSFontResolver),
    )
}

object DS {
    val current: DesignSystem
        @Composable
        @ReadOnlyComposable
        get() = LocalDesignSystem.current
}

/** When [supportsDark] is false, always use the light palette even if the OS is dark. */
fun DSThemeTokens.effectiveDark(systemDark: Boolean): Boolean = supportsDark && systemDark

fun DSFontFamilyResolver.resolve(family: String, headingRole: Boolean): FontFamily =
    this(family) ?: if (headingRole) FontFamily.Serif else FontFamily.Default

internal fun buildMobileTypography(tokens: DSThemeTokens, fonts: DSFontFamilyResolver): DSMobileTypography {
    fun roleStyle(role: DSTextRole, heading: Boolean): TextStyle =
        TextStyle(
            fontFamily = fonts.resolve(role.family, heading),
            fontSize = role.size.sp,
            lineHeight = role.lineHeight.sp,
            fontWeight = FontWeight(role.weight),
        )
    val mt = tokens.mobileType
    return DSMobileTypography(
        title = roleStyle(mt.title, heading = true),
        headline = roleStyle(mt.headline, heading = true),
        body = roleStyle(mt.body, heading = false),
        label = roleStyle(mt.label, heading = false),
        caption = roleStyle(mt.caption, heading = false),
    )
}

/**
 * Wrap the app root: `DSTheme(DSTokens.church) { ... }`.
 * Pass [fonts] to map theme family names to app-bundled [FontFamily]; unresolved names fall back to
 * serif (title/headline roles) or the platform default sans (body, label, caption).
 */
@Composable
fun DSTheme(
    theme: DSThemeTokens,
    dark: Boolean = isSystemInDarkTheme(),
    fonts: DSFontFamilyResolver = DefaultDSFontResolver,
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
        LocalDesignSystem provides DesignSystem(theme, c, useDark, mobileTypography),
    ) {
        MaterialTheme(colorScheme = material, typography = typography, shapes = shapes, content = content)
    }
}

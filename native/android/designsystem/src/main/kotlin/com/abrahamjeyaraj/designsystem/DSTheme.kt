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
import android.graphics.Typeface
import android.os.Build
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Returns the app-bundled [FontFamily] for [familyName] (a `fontFamily.*.family` name from the theme),
 * or null to use role-based fallbacks. The library bundles no fonts: without a resolver every role
 * uses serif (title, headline) or the platform default sans.
 */
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

private val DefaultTheme: DSThemeTokens = DSTokens.themes.getValue(DSTokens.DEFAULT_THEME)

val LocalDesignSystem = staticCompositionLocalOf {
    DesignSystem(
        tokens = DefaultTheme,
        colors = DefaultTheme.light,
        dark = false,
        typography = buildMobileTypography(DefaultTheme, DefaultDSFontResolver),
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
    this(family) ?: DSFontResolver.fallbackFontFamily(headingRole)

enum class DSFontFallback { Serif, System }

/** Font lookup exposed for apps that want to diagnose which theme fonts are installed. Mirrors Swift `DSFontResolver`. */
object DSFontResolver {
    fun fallback(forHeading: Boolean): DSFontFallback = if (forHeading) DSFontFallback.Serif else DSFontFallback.System

    fun fallbackFontFamily(forHeading: Boolean): FontFamily =
        if (forHeading) FontFamily.Serif else FontFamily.Default

    fun isAvailable(family: String): Boolean {
        if (family.isBlank()) return false
        return runCatching {
            val created = Typeface.create(family, Typeface.NORMAL) ?: return false
            val default = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            if (created == default) return false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return typefaceFamilyName(created)?.equals(family, ignoreCase = true) == true
            }
            family.equals("sans-serif", ignoreCase = true) ||
                family.equals("serif", ignoreCase = true) ||
                family.equals("monospace", ignoreCase = true)
        }.getOrDefault(false)
    }

    private fun typefaceFamilyName(typeface: Typeface): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return null
        return runCatching {
            Typeface::class.java.getMethod("getFamilyName").invoke(typeface) as? String
        }.getOrNull()
    }

    fun weight(tokenWeight: Int): FontWeight = when {
        tokenWeight < 450 -> FontWeight.Normal
        tokenWeight < 550 -> FontWeight.Medium
        tokenWeight < 650 -> FontWeight.SemiBold
        tokenWeight < 750 -> FontWeight.Bold
        tokenWeight < 850 -> FontWeight.ExtraBold
        else -> FontWeight.Black
    }
}

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
 * Wrap the app root: `DSTheme(AppTheme) { ... }`, where `AppTheme` is generated by `ds-tokens kotlin`.
 *
 * Fonts: the library bundles none. Pass [fonts] to map theme family names to app-bundled
 * [FontFamily]; without it every name falls back to serif (title/headline roles) or the platform
 * default sans (body, label, caption).
 *
 * Material: by default this installs a [MaterialTheme] built from the tokens (colours, typography,
 * shapes). Pass [applyMaterial] = false to provide only the DS tokens and keep the app's own
 * MaterialTheme, e.g. `MyMaterialTheme { DSTheme(AppTheme, applyMaterial = false) { ... } }`.
 */
@Composable
fun DSTheme(
    theme: DSThemeTokens,
    dark: Boolean = isSystemInDarkTheme(),
    fonts: DSFontFamilyResolver = DefaultDSFontResolver,
    applyMaterial: Boolean = true,
    content: @Composable () -> Unit,
) {
    val useDark = theme.effectiveDark(dark)
    val c = theme.colors(useDark)
    val mobileTypography = buildMobileTypography(theme, fonts)
    if (!applyMaterial) {
        CompositionLocalProvider(LocalDesignSystem provides DesignSystem(theme, c, useDark, mobileTypography), content = content)
        return
    }
    val material = if (useDark) {
        darkColorScheme(
            primary = Color(c.primary),
            onPrimary = Color(c.primaryForeground),
            secondary = Color(c.accent2),
            onSecondary = Color(c.background),
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
            secondary = Color(c.accent2),
            onSecondary = Color(c.background),
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
        // Map every Material heading slot so screens using MaterialTheme.typography get the theme fonts.
        headlineLarge = mobileTypography.title,
        headlineMedium = mobileTypography.headline,
        headlineSmall = mobileTypography.headline,
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

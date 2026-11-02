package com.abrahamjeyaraj.designsystem

import androidx.compose.ui.text.font.FontFamily
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DSThemeTest {
    @Test
    fun effectiveDarkHonoursSupportsDark() {
        assertTrue(DSTokens.default.effectiveDark(systemDark = true))
        assertFalse(DSTokens.default.effectiveDark(systemDark = false))
    }

    @Test
    fun defaultUsesDarkPaletteWhenSupported() {
        val scheme = DSTokens.default.colors(DSTokens.default.effectiveDark(systemDark = true))
        assertEquals(DSTokens.default.dark.background, scheme.background)
    }

    @Test
    fun fontResolverFallsBackToSerifForHeadingRoles() {
        val resolver: DSFontFamilyResolver = { null }
        assertEquals(FontFamily.Serif, resolver.resolve("Inter", headingRole = true))
        assertEquals(FontFamily.Default, resolver.resolve("Inter", headingRole = false))
    }

    @Test
    fun fontResolverUsesBundledFamilyWhenProvided() {
        val custom = FontFamily.Cursive
        val resolver: DSFontFamilyResolver = { name -> if (name == "Inter") custom else null }
        assertEquals(custom, resolver.resolve("Inter", headingRole = false))
    }

    @Test
    fun mobileTypographyUsesTokenSizes() {
        val typo = buildMobileTypography(DSTokens.default) { null }
        assertEquals(DSTokens.default.mobileType.title.size.toFloat(), typo.title.fontSize.value, 0.01f)
        assertEquals(DSTokens.default.mobileType.body.size.toFloat(), typo.body.fontSize.value, 0.01f)
    }
}

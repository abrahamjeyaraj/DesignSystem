package com.abrahamjeyaraj.designsystem

import androidx.compose.ui.text.font.FontFamily
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DSThemeTest {
    @Test
    fun effectiveDarkHonoursSupportsDark() {
        assertFalse(DSTokens.tuition.effectiveDark(systemDark = true))
        assertFalse(DSTokens.tuition.effectiveDark(systemDark = false))
        assertTrue(DSTokens.church.effectiveDark(systemDark = true))
        assertFalse(DSTokens.church.effectiveDark(systemDark = false))
    }

    @Test
    fun tuitionStaysOnLightPaletteWhenSystemDark() {
        val scheme = DSTokens.tuition.colors(DSTokens.tuition.effectiveDark(systemDark = true))
        assertEquals(DSTokens.tuition.light.background, scheme.background)
        assertEquals(DSTokens.tuition.light.ink, scheme.ink)
    }

    @Test
    fun churchUsesDarkPaletteWhenSupported() {
        val scheme = DSTokens.church.colors(DSTokens.church.effectiveDark(systemDark = true))
        assertEquals(DSTokens.church.dark.background, scheme.background)
    }

    @Test
    fun fontResolverFallsBackToSerifForHeadingRoles() {
        val resolver: DSFontFamilyResolver = { null }
        assertEquals(FontFamily.Serif, resolver.resolve("Fraunces", headingRole = true))
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
        val typo = buildMobileTypography(DSTokens.tuition) { null }
        assertEquals(DSTokens.tuition.mobileType.title.size.toFloat(), typo.title.fontSize.value, 0.01f)
        assertEquals(DSTokens.tuition.mobileType.body.size.toFloat(), typo.body.fontSize.value, 0.01f)
    }
}

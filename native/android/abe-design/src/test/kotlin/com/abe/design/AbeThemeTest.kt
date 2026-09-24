package com.abe.design

import androidx.compose.ui.text.font.FontFamily
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AbeThemeTest {
    @Test
    fun effectiveDarkHonoursSupportsDark() {
        assertFalse(AbeTokens.tuition.effectiveDark(systemDark = true))
        assertFalse(AbeTokens.tuition.effectiveDark(systemDark = false))
        assertTrue(AbeTokens.church.effectiveDark(systemDark = true))
        assertFalse(AbeTokens.church.effectiveDark(systemDark = false))
    }

    @Test
    fun tuitionStaysOnLightPaletteWhenSystemDark() {
        val scheme = AbeTokens.tuition.colors(AbeTokens.tuition.effectiveDark(systemDark = true))
        assertEquals(AbeTokens.tuition.light.background, scheme.background)
        assertEquals(AbeTokens.tuition.light.ink, scheme.ink)
    }

    @Test
    fun churchUsesDarkPaletteWhenSupported() {
        val scheme = AbeTokens.church.colors(AbeTokens.church.effectiveDark(systemDark = true))
        assertEquals(AbeTokens.church.dark.background, scheme.background)
    }

    @Test
    fun fontResolverFallsBackToSerifForHeadingRoles() {
        val resolver: AbeFontFamilyResolver = { null }
        assertEquals(FontFamily.Serif, resolver.resolve("Fraunces", headingRole = true))
        assertEquals(FontFamily.Default, resolver.resolve("Inter", headingRole = false))
    }

    @Test
    fun fontResolverUsesBundledFamilyWhenProvided() {
        val custom = FontFamily.Cursive
        val resolver: AbeFontFamilyResolver = { name -> if (name == "Inter") custom else null }
        assertEquals(custom, resolver.resolve("Inter", headingRole = false))
    }

    @Test
    fun mobileTypographyUsesTokenSizes() {
        val typo = buildMobileTypography(AbeTokens.tuition) { null }
        assertEquals(AbeTokens.tuition.mobileType.title.size.toFloat(), typo.title.fontSize.value, 0.01f)
        assertEquals(AbeTokens.tuition.mobileType.body.size.toFloat(), typo.body.fontSize.value, 0.01f)
    }
}

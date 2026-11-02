package com.abrahamjeyaraj.designsystem

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class DSFontResolverTest {
    @Test
    fun fallbackUsesSerifForHeadingsAndSystemForOtherRoles() {
        assertEquals(DSFontFallback.Serif, DSFontResolver.fallback(forHeading = true))
        assertEquals(DSFontFallback.System, DSFontResolver.fallback(forHeading = false))
    }

    @Test
    fun missingFontIsNotAvailable() {
        assertFalse(DSFontResolver.isAvailable("DesignSystem Missing Font"))
    }
}

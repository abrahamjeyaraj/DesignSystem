package com.abrahamjeyaraj.designsystem

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DSTokensTest {
    @Test
    fun themesKeepTheirOwnLook() {
        assertEquals(0xFFC8B496, DSTokens.bible.light.action)
        assertEquals(0xFF1A6B54, DSTokens.church.light.primary)
        assertEquals(9999.0, DSTokens.tuition.radius.button, 0.0)
        assertTrue(DSTokens.bible.label.uppercase)
        assertEquals(3, DSTokens.themes.size)
    }
}

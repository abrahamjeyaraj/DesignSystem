package com.abe.design

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AbeTokensTest {
    @Test
    fun themesKeepTheirOwnLook() {
        assertEquals(0xFFC8B496, AbeTokens.bible.light.action)
        assertEquals(0xFF1A6B54, AbeTokens.church.light.primary)
        assertEquals(9999.0, AbeTokens.tuition.radius.button, 0.0)
        assertTrue(AbeTokens.bible.label.uppercase)
        assertEquals(3, AbeTokens.themes.size)
    }
}

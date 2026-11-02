package com.abrahamjeyaraj.designsystem

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DSTokensTest {
    @Test
    fun defaultThemeValues() {
        assertEquals(0xFF2563EB, DSTokens.default.light.action)
        assertEquals(0xFF2563EB, DSTokens.default.light.primary)
        assertEquals(6.0, DSTokens.default.radius.button, 0.0)
        assertFalse(DSTokens.default.label.uppercase)
    }
}

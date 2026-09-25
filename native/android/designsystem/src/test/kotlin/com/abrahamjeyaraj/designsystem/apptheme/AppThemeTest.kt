package com.abrahamjeyaraj.designsystem.apptheme

import com.abrahamjeyaraj.designsystem.DSTokens
import org.junit.Assert.assertEquals
import org.junit.Test

/** AppTheme.kt is what `ds-tokens kotlin` writes into an app, in the app's own package. */
class AppThemeTest {
    @Test
    fun appOwnedThemeMatchesBuiltIn() {
        assertEquals(DSTokens.tuition, TuitionTheme)
    }
}

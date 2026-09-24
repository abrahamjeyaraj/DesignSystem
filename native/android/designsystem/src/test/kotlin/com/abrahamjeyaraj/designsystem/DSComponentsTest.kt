package com.abrahamjeyaraj.designsystem

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class DSComponentsTest {
    @Test
    fun penV2MetricsMatchPenSpec() {
        assertEquals(14.dp, DSPenMetrics.WeekCellRadius)
        assertEquals(4.dp, DSPenMetrics.LoadDotSize)
        assertEquals(36.dp, DSPenMetrics.CountPillHeight)
        assertEquals(64.dp, DSPenMetrics.PresetTileHeight)
        assertEquals(48.dp, DSPenMetrics.MarkToggleSize)
    }
}

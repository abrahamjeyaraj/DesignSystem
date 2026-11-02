package com.abrahamjeyaraj.designsystem

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class DSComponentsTest {
    @Test
    fun componentMetricsMatchSwiftAdapter() {
        assertEquals(12.dp, DSComponentMetrics.WeekCellRadius)
        assertEquals(4.dp, DSComponentMetrics.LoadDotSize)
        assertEquals(36.dp, DSComponentMetrics.CountPillHeight)
        assertEquals(64.dp, DSComponentMetrics.PresetTileHeight)
        assertEquals(48.dp, DSComponentMetrics.MarkToggleSize)
        assertEquals(listOf(120.dp, 150.dp, 104.dp), DSComponentMetrics.PodiumHeights)
        assertEquals(52.dp, DSComponentMetrics.ButtonHeight)
        assertEquals(16.dp, DSComponentMetrics.ButtonHPadding)
        assertEquals(18.dp, DSComponentMetrics.CardPadding)
        assertEquals(16.dp, DSComponentMetrics.CardRadius)
        assertEquals(14.dp, DSComponentMetrics.ControlRadius)
        assertEquals(44.dp, DSComponentMetrics.FieldHeight)
        assertEquals(14.dp, DSComponentMetrics.FieldHPadding)
        assertEquals(9.dp, DSComponentMetrics.WeekCellTopPadding)
        assertEquals(7.dp, DSComponentMetrics.WeekCellBottomPadding)
    }
}

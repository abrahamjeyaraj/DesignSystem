package com.abrahamjeyaraj.designsystem

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DSSnackbarHostStateTest {
    @Test
    fun showTwiceWithSameMessageIncrementsGenerationAndStoresDuration() {
        val state = DSSnackbarHostState()
        state.show("Ananya +1 ★", durationMs = 3000)
        val firstGen = state.showGeneration
        assertEquals("Ananya +1 ★", state.currentMessage)
        assertEquals(3000L, state.durationMs)

        state.show("Ananya +1 ★", durationMs = 8000)
        assertEquals(8000L, state.durationMs)
        assertNotEquals(firstGen, state.showGeneration)
        assertEquals(firstGen + 1, state.showGeneration)
    }

    @Test
    fun dismissClearsPayload() {
        val state = DSSnackbarHostState()
        state.show("Hi", actionLabel = "Undo", onAction = {})
        state.dismiss()
        assertNull(state.currentMessage)
        assertNull(state.actionLabel)
        assertNull(state.onAction)
    }
}

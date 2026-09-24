package com.abe.design

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Today
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Composable
fun AbeGallery(modifier: Modifier = Modifier) {
    val design = Abe.current
    val tokens = design.tokens
    var segment by remember { mutableIntStateOf(0) }
    var tab by remember { mutableIntStateOf(0) }
    var field by remember { mutableStateOf("₹12,000") }
    var search by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .backgroundFromTheme()
            .padding(bottom = tokens.mobileLayout.sectionGap.dp),
        verticalArrangement = Arrangement.spacedBy(tokens.mobileLayout.sectionGap.dp),
    ) {
        AbeLargeTitle(title = "Today", eyebrow = "Friday, 19 September", trailing = {
            AbeIconButton(Icons.Default.Today, onClick = {}, contentDescription = "Calendar")
        })
        AbeSearchField(search, onQueryChange = { search = it }, placeholder = "Search students")
        AbeSegmentedControl(listOf("All", "Due", "Overdue", "Paid"), segment, onSelected = { segment = it })
        Row(Modifier.fillMaxWidth().padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AbeStatTile("Collected", "₹3,84,000", meta = "+12% vs Aug", metaTone = AbeStatTone.Success)
            AbeStatTile("Due", "₹42,000", meta = "8 students", metaTone = AbeStatTone.Warning)
        }
        AbeSectionHeader("Classes today", actionLabel = "See all", onAction = {})
        AbeListRow(
            title = "Ananya Raghavan",
            subtitle = "Class 10 · Maths, Physics",
            leading = { AbeAvatar("AR") },
            trailing = { AbeChip("Paid", variant = AbeChipVariant.Success) },
            onClick = {},
        )
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AbeChip("Class 10", variant = AbeChipVariant.Neutral)
            AbeChip("Due", variant = AbeChipVariant.Warning)
            AbeChip("Overdue", variant = AbeChipVariant.Error)
            AbeChip("Active", variant = AbeChipVariant.Accent)
        }
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AbeButton("Record payment", onClick = {}, variant = AbeButtonVariant.Primary, leadingIcon = Icons.Default.Payments)
            AbeButton("Remind", onClick = {}, variant = AbeButtonVariant.Secondary)
        }
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AbeButton("Ghost", onClick = {}, variant = AbeButtonVariant.Ghost)
            AbeButton("Delete", onClick = {}, variant = AbeButtonVariant.Destructive)
        }
        AbeField("Amount", field, onValueChange = { field = it }, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp))
        AbeCard(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp).fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                AbeText("Card title", AbeTextStyle.Headline)
                AbeText("Supporting copy from tokens only.", AbeTextStyle.Body)
            }
        }
        AbeEmptyState(
            title = "No students",
            message = "Try adjusting your filters.",
            icon = Icons.Default.SearchOff,
            actionLabel = "Clear filters",
            onAction = {},
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
        )
        AbeNavBar("Student")
        AbeSheetHandle()
        AbeTabBar(
            items = listOf(
                AbeTabItem("Today", Icons.Default.Today),
                AbeTabItem("Students", Icons.Default.Groups),
                AbeTabItem("Fees", Icons.Default.Payments),
                AbeTabItem("Classes", Icons.Default.School),
                AbeTabItem("More", Icons.Default.CalendarToday),
            ),
            selectedIndex = tab,
            onSelected = { tab = it },
        )
        Column(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            AbeText("Title style", AbeTextStyle.Title)
            AbeText("Headline style", AbeTextStyle.Headline)
            AbeText("Body style", AbeTextStyle.Body)
            AbeText("Label style", AbeTextStyle.Label)
            AbeText("Caption style", AbeTextStyle.Caption)
        }
    }
}

@Composable
private fun Modifier.backgroundFromTheme(): Modifier {
    val c = Abe.current.colors
    return background(Color(c.background))
}

@Preview(name = "Tuition Light", showBackground = true, widthDp = 390)
@Composable
private fun PreviewTuitionLight() {
    AbeTheme(AbeTokens.tuition, dark = false) { AbeGallery() }
}

@Preview(name = "Tuition Dark (light-only theme)", showBackground = true, widthDp = 390)
@Composable
private fun PreviewTuitionDark() {
    AbeTheme(AbeTokens.tuition, dark = true) { AbeGallery() }
}

@Preview(name = "Church Light", showBackground = true, widthDp = 390)
@Composable
private fun PreviewChurchLight() {
    AbeTheme(AbeTokens.church, dark = false) { AbeGallery() }
}

@Preview(name = "Church Dark", showBackground = true, widthDp = 390)
@Composable
private fun PreviewChurchDark() {
    AbeTheme(AbeTokens.church, dark = true) { AbeGallery() }
}

@Preview(name = "Bible Light", showBackground = true, widthDp = 390)
@Composable
private fun PreviewBibleLight() {
    AbeTheme(AbeTokens.bible, dark = false) { AbeGallery() }
}

@Preview(name = "Bible Dark", showBackground = true, widthDp = 390)
@Composable
private fun PreviewBibleDark() {
    AbeTheme(AbeTokens.bible, dark = true) { AbeGallery() }
}

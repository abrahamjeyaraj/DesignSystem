package com.abrahamjeyaraj.designsystem

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
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.Text
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
fun DSGallery(modifier: Modifier = Modifier) {
    val design = DS.current
    val tokens = design.tokens
    var segment by remember { mutableIntStateOf(0) }
    var tab by remember { mutableIntStateOf(0) }
    var field by remember { mutableStateOf("₹12,000") }
    var search by remember { mutableStateOf("") }
    var mark by remember { mutableStateOf(true) }
    var stepper by remember { mutableIntStateOf(3) }
    var preset by remember { mutableStateOf("5") }
    var weekDay by remember { mutableStateOf("fri") }
    var notes by remember { mutableStateOf("Great progress.") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .backgroundFromTheme()
            .padding(bottom = tokens.mobileLayout.sectionGap.dp),
        verticalArrangement = Arrangement.spacedBy(tokens.mobileLayout.sectionGap.dp),
    ) {
        DSLargeTitle(title = "Today", eyebrow = "Friday, 19 September", trailing = {
            DSIconButton(Icons.Default.Today, onClick = {}, contentDescription = "Calendar")
        })
        DSSearchField(search, onQueryChange = { search = it }, placeholder = "Search items")
        DSSegmentedControl(listOf("All", "Due", "Overdue", "Paid"), segment, onSelected = { segment = it })
        Row(Modifier.fillMaxWidth().padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DSStatTile("Collected", "₹3,84,000", meta = "+12% vs Aug", metaTone = DSStatTone.Success)
            DSStatTile("Due", "₹42,000", meta = "8 people", metaTone = DSStatTone.Warning)
        }
        DSSectionHeader("Classes today", actionLabel = "See all", onAction = {})
        DSListRow(
            title = "Alex Morgan",
            subtitle = "Group A · Design, Research",
            leading = { DSAvatar("AR") },
            trailing = { DSChip("Paid", variant = DSChipVariant.Success) },
            onClick = {},
        )
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DSChip("Group A", variant = DSChipVariant.Neutral)
            DSChip("Due", variant = DSChipVariant.Warning)
            DSChip("Overdue", variant = DSChipVariant.Error)
            DSChip("Active", variant = DSChipVariant.Accent)
        }
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DSButton("Record payment", onClick = {}, variant = DSButtonVariant.Primary, leadingIcon = Icons.Default.Payments)
            DSButton("Remind", onClick = {}, variant = DSButtonVariant.Secondary)
        }
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DSButton("Ghost", onClick = {}, variant = DSButtonVariant.Ghost)
            DSButton("Delete", onClick = {}, variant = DSButtonVariant.Destructive)
        }
        DSField("Amount", field, onValueChange = { field = it }, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp))
        DSCard(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp).fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DSText("Card title", DSTextStyle.Headline)
                DSText("Supporting copy from tokens only.", DSTextStyle.Body)
            }
        }
        var toggle by remember { mutableStateOf(true) }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DSToggle(toggle,{toggle=it},label="Gallery toggle on")
            DSToggle(false,{},label="Gallery toggle off")
        }
        DSProgress(.72f,label="Recent tests",valueLabel="72%",tone=DSProgressTone.Accent2,modifier=Modifier.padding(horizontal=tokens.mobileLayout.gutter.dp))
        DSInkCard(Modifier.padding(horizontal=tokens.mobileLayout.gutter.dp)) { Text("Up next",color=Color(design.colors.onInkAccent)); Text("Evening session",color=Color(design.colors.onInk)) }
        DSNudge("Reminders ready","3 people to follow up",Icons.Default.Today,onClick={})
        DSEmptyState(
            title = "No items yet",
            message = "Try adjusting your filters.",
            icon = Icons.Default.SearchOff,
            actionLabel = "Clear filters",
            onAction = {},
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
        )
        DSNavBar("Details")
        DSSheetHandle()
        DSTabBar(
            items = listOf(
                DSTabItem("Today", Icons.Default.Today),
                DSTabItem("People", Icons.Default.Groups),
                DSTabItem("Payments", Icons.Default.Payments),
                DSTabItem("Library", Icons.Default.School),
                DSTabItem("More", Icons.Default.CalendarToday),
            ),
            selectedIndex = tab,
            onSelected = { tab = it },
        )
        DSSectionHeader("Patterns")
        DSSnackbarBar("Item added", actionLabel = "Undo", onAction = {}, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp))
        DSWeekStrip(
            days = listOf(
                DSWeekStripDay("mon", "M", 15, 3),
                DSWeekStripDay("fri", "F", 19, 4),
                DSWeekStripDay("sat", "S", 20, 1),
            ),
            selectedDayId = weekDay,
            todayDayId = "fri",
            onSelect = { weekDay = it.id },
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
        )
        DSTimelineRow("09:30", "10:30", DSTimelineRowState.Live, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), content = {
            DSText("Morning session", DSTextStyle.Headline)
        }, footer = { DSChip("Live", variant = DSChipVariant.Accent) })
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DSCountPill("#", 42, onClick = {})
            DSMarkToggle(mark, onMarkedChange = { mark = it }, contentDescription = "Mark toggle")
        }
        DSPodium(
            entries = listOf(
                DSPodiumEntry("2", "Alex", "42 pts · #2", 120.dp),
                DSPodiumEntry("1", "Jordan", "51 pts · #1", 150.dp, isLeader = true),
                DSPodiumEntry("3", "Sam", "38 pts · #3", 104.dp),
            ),
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
            avatar = { DSAvatar(it.name.take(2)) },
        )
        DSSummaryBar(
            listOf(
                DSSummaryItem("Done", "7", DSStatTone.Success),
                DSSummaryItem("Pending", "1", DSStatTone.Error),
                DSSummaryItem("Average", "92%"),
            ),
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
        )
        DSPresetGrid(
            listOf(DSPresetOption("1", "+1"), DSPresetOption("5", "+5"), DSPresetOption("10", "+10")),
            preset,
            onSelect = { preset = it.id },
            modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp),
        )
        DSStepper(stepper, onValueChange = { stepper = it }, range = 1..99, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp))
        Row(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DSQuickActionTile("Call", Icons.Default.Phone, onClick = {}, modifier = Modifier.weight(1f))
            DSQuickActionTile("History", Icons.Default.Today, onClick = {}, modifier = Modifier.weight(1f))
        }
        DSActivityRow("Record updated", "16:52", detail = "Entry saved", icon = Icons.Default.Today, actionLabel = "Undo", onAction = {})
        DSMultilineField("Notes", notes, onValueChange = { notes = it }, modifier = Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp))
        Column(Modifier.padding(horizontal = tokens.mobileLayout.gutter.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            DSText("Title style", DSTextStyle.Title)
            DSText("Headline style", DSTextStyle.Headline)
            DSText("Body style", DSTextStyle.Body)
            DSText("Label style", DSTextStyle.Label)
            DSText("Caption style", DSTextStyle.Caption)
        }
    }
}

@Composable
private fun Modifier.backgroundFromTheme(): Modifier {
    val c = DS.current.colors
    return background(Color(c.background))
}

@Preview(name = "Default Light", showBackground = true, widthDp = 390)
@Composable
private fun PreviewDefaultLight() {
    DSTheme(DSTokens.default, dark = false) { DSGallery() }
}

@Preview(name = "Default Dark", showBackground = true, widthDp = 390)
@Composable
private fun PreviewDefaultDark() {
    DSTheme(DSTokens.default, dark = true) { DSGallery() }
}

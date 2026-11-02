package com.abrahamjeyaraj.designsystem

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Stable
class DSSnackbarHostState {
    var currentMessage by mutableStateOf<String?>(null)
    var actionLabel by mutableStateOf<String?>(null)
    var onAction: (() -> Unit)? = null
    /** Increments on every [show] so the host restarts auto-dismiss even for the same message. */
    var showGeneration by mutableIntStateOf(0)
    var durationMs by mutableStateOf(5000L)

    fun show(
        message: String,
        actionLabel: String? = null,
        onAction: (() -> Unit)? = null,
        durationMs: Long = 5000,
    ) {
        currentMessage = message
        this.actionLabel = actionLabel
        this.onAction = onAction
        this.durationMs = durationMs
        showGeneration++
    }

    fun dismiss() {
        currentMessage = null
        actionLabel = null
        onAction = null
    }
}

@Composable
fun DSSnackbarHost(
    hostState: DSSnackbarHostState,
    modifier: Modifier = Modifier,
) {
    val message = hostState.currentMessage
    val generation = hostState.showGeneration
    val durationMs = hostState.durationMs
    LaunchedEffect(generation) {
        if (hostState.currentMessage != null) {
            delay(durationMs)
            if (hostState.showGeneration == generation) {
                hostState.dismiss()
            }
        }
    }
    AnimatedVisibility(
        visible = message != null,
        modifier = modifier,
        enter = slideInVertically { it },
        exit = slideOutVertically { it },
    ) {
        if (message != null) {
            DSSnackbarBar(
                message = message,
                actionLabel = hostState.actionLabel,
                onAction = {
                    hostState.onAction?.invoke()
                    hostState.dismiss()
                },
            )
        }
    }
}

@Composable
fun DSSnackbarBar(
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .background(Color(c.ink900))
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .semantics { contentDescription = message },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            message,
            modifier = Modifier.weight(1f),
            style = design.typography.body.copy(fontWeight = FontWeight.Medium, color = Color(c.onInk)),
        )
        if (actionLabel != null && onAction != null) {
            Text(
                actionLabel,
                modifier = Modifier
                    .defaultMinSize(minWidth = design.tokens.mobileLayout.touchTarget.dp, minHeight = 48.dp)
                    .clickable(role = Role.Button, onClick = onAction)
                    .semantics { contentDescription = actionLabel },
                style = design.typography.label.copy(fontWeight = FontWeight.SemiBold, color = Color(c.onInkAccent)),
            )
        }
    }
}

data class DSWeekStripDay(
    val id: String,
    val weekdaySymbol: String,
    val dayNumber: Int,
    val loadCount: Int = 0,
)

@Composable
fun DSWeekStrip(
    days: List<DSWeekStripDay>,
    selectedDayId: String,
    onSelect: (DSWeekStripDay) -> Unit,
    modifier: Modifier = Modifier,
    todayDayId: String? = null,
    isInteractive: Boolean = true,
    eventDot: Long? = null,
    highlightedNameInk: Long? = null,
) {
    val design = DS.current
    val c = design.colors
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        days.forEach { day ->
            val selected = day.id == selectedDayId
            val highlighted = if (isInteractive) selected else day.id == todayDayId
            val cellShape = RoundedCornerShape(DSComponentMetrics.WeekCellRadius)
            val borderColor = if (highlighted) c.primary else c.border
            val nameInk = if (highlighted) (highlightedNameInk ?: c.actionForeground) else c.inkMuted
            val numberInk = if (highlighted) c.actionForeground else c.foreground
            val tile: @Composable () -> Unit = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(if (highlighted) c.action else c.card), cellShape)
                        .border(1.dp, Color(borderColor), cellShape)
                        .padding(
                            top = DSComponentMetrics.WeekCellTopPadding,
                            bottom = DSComponentMetrics.WeekCellBottomPadding,
                        )
                        .semantics {
                            contentDescription = "${day.weekdaySymbol} ${day.dayNumber}"
                            if (selected) stateDescription = "Selected"
                        },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Text(
                        day.weekdaySymbol,
                        fontSize = DSComponentMetrics.WeekDayNameSize,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.5.sp,
                        fontFamily = design.typography.caption.fontFamily,
                        color = Color(nameInk),
                    )
                    Text(
                        day.dayNumber.toString(),
                        fontSize = DSComponentMetrics.WeekDayNumberSize,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = design.typography.body.fontFamily,
                        color = Color(numberInk),
                    )
                    Box(
                        Modifier.size(DSComponentMetrics.LoadDotSize),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (day.loadCount > 0) {
                            Box(
                                Modifier
                                    .size(DSComponentMetrics.LoadDotSize)
                                    .clip(CircleShape)
                                    .background(Color(eventDot ?: c.warning)),
                            )
                        }
                    }
                }
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .then(
                        if (isInteractive) {
                            Modifier.clickable(role = Role.Tab, onClick = { onSelect(day) })
                        } else Modifier,
                    ),
            ) {
                tile()
            }
        }
    }
}

enum class DSTimelineRowState { Past, Live, Upcoming }

@Composable
fun DSTimelineRow(
    timeStart: String,
    timeEnd: String,
    state: DSTimelineRowState,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
    footer: @Composable () -> Unit = {},
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    val cardFill = if (state == DSTimelineRowState.Live) c.ink900 else c.card
    val primary = if (state == DSTimelineRowState.Live) c.onInk else c.ink
    val muted = if (state == DSTimelineRowState.Live) c.onInkMuted else c.inkMuted
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        Column(
            Modifier
                .width(DSComponentMetrics.TimelineGutterWidth)
                .padding(top = 14.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(timeStart, style = design.typography.label.copy(fontWeight = FontWeight.SemiBold, color = Color(primary)))
            Text(timeEnd, style = design.typography.caption.copy(color = Color(muted)))
        }
        Column(
            Modifier
                .weight(1f)
                .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
                .background(Color(cardFill))
                .then(if (state != DSTimelineRowState.Live) Modifier.border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp)) else Modifier)
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            content()
            footer()
        }
    }
}

@Composable
fun DSCountPill(
    symbol: String,
    count: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    contentDescription: String = "$symbol $count",
) {
    val design = DS.current
    val c = design.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Row(
        modifier = modifier
            .height(DSComponentMetrics.CountPillHeight)
            .clip(RoundedCornerShape(design.tokens.radius.full.dp))
            .background(Color(c.muted).copy(alpha = if (pressed) 0.75f else 1f))
            .clickable(interactionSource = interaction, indication = null, role = Role.Button, onClick = onClick)
            .padding(horizontal = 12.dp)
            .semantics { this.contentDescription = contentDescription },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(symbol, style = design.typography.body.copy(fontWeight = FontWeight.SemiBold, color = Color(c.ink)))
        Text(count.toString(), style = design.typography.body.copy(fontWeight = FontWeight.SemiBold, color = Color(c.ink)))
    }
}

data class DSPodiumEntry(
    val id: String,
    val name: String,
    val value: String,
    val columnHeight: androidx.compose.ui.unit.Dp,
    val isLeader: Boolean = false,
)

@Composable
fun DSPodium(
    entries: List<DSPodiumEntry>,
    modifier: Modifier = Modifier,
    avatar: @Composable (DSPodiumEntry) -> Unit,
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
        entries.forEach { entry ->
            val fill = if (entry.isLeader) c.ink900 else c.card
            val title = if (entry.isLeader) c.onInk else c.ink
            val meta = if (entry.isLeader) c.onInkAccent else c.inkMuted
            Column(
                Modifier
                    .weight(1f)
                    .height(entry.columnHeight)
                    .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
                    .background(Color(fill))
                    .then(if (!entry.isLeader) Modifier.border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp)) else Modifier)
                    .padding(horizontal = 8.dp, vertical = 14.dp)
                    .semantics { contentDescription = "${entry.name}, ${entry.value}" },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom,
            ) {
                avatar(entry)
                Spacer(Modifier.height(6.dp))
                Text(entry.name, style = design.typography.body.copy(fontWeight = FontWeight.SemiBold, color = Color(title)), textAlign = TextAlign.Center)
                Text(entry.value, style = design.typography.caption.copy(color = Color(meta)), textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
fun DSMarkToggle(
    marked: Boolean,
    onMarkedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    contentDescription: String,
) {
    val design = DS.current
    val c = design.colors
    Box(
        modifier = modifier
            .size(DSComponentMetrics.MarkToggleSize)
            .clip(CircleShape)
            .background(Color(if (marked) c.successLight else c.error))
            .clickable(role = Role.Switch, onClick = { onMarkedChange(!marked) })
            .semantics {
                this.contentDescription = contentDescription
                stateDescription = if (marked) "On" else "Off"
            },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            if (marked) Icons.Default.Check else Icons.Default.Close,
            contentDescription = null,
            tint = Color(if (marked) c.success else c.destructiveForeground),
            modifier = Modifier.size(DSComponentMetrics.MarkIconSize),
        )
    }
}

data class DSSummaryItem(val label: String, val value: String, val tone: DSStatTone = DSStatTone.Default)

@Composable
fun DSSummaryBar(items: List<DSSummaryItem>, modifier: Modifier = Modifier) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .background(Color(c.card))
            .padding(vertical = 14.dp),
    ) {
        items.forEach { item ->
            val valueColor = when (item.tone) {
                DSStatTone.Success -> c.success
                DSStatTone.Warning -> c.warning
                DSStatTone.Error -> c.error
                DSStatTone.Default -> c.ink
            }
            Column(
                Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(item.value, style = design.typography.headline.copy(fontWeight = FontWeight.SemiBold, color = Color(valueColor)))
                Text(item.label, style = design.typography.caption.copy(color = Color(c.inkMuted)))
            }
        }
    }
}

data class DSPresetOption(val id: String, val label: String)

@Composable
fun DSPresetGrid(
    options: List<DSPresetOption>,
    selectedId: String?,
    onSelect: (DSPresetOption) -> Unit,
    modifier: Modifier = Modifier,
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        options.forEach { option ->
            val selected = option.id == selectedId
            Box(
                Modifier
                    .weight(1f)
                    .height(DSComponentMetrics.PresetTileHeight)
                    .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
                    .background(Color(if (selected) c.action else c.card))
                    .then(if (!selected) Modifier.border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp)) else Modifier)
                    .clickable(role = Role.Button, onClick = { onSelect(option) })
                    .semantics { contentDescription = option.label },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    option.label,
                    style = design.typography.headline.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = Color(if (selected) c.actionForeground else c.ink),
                    ),
                )
            }
        }
    }
}

@Composable
fun DSStepper(
    value: Int,
    onValueChange: (Int) -> Unit,
    range: IntRange,
    modifier: Modifier = Modifier,
    label: String = "Value stepper",
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(DSComponentMetrics.PresetTileHeight)
            .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .background(Color(c.card))
            .padding(horizontal = tokens.mobileLayout.gutter.dp)
            .semantics { contentDescription = label },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        DSIconButton(Icons.Default.Remove, onClick = { onValueChange((value - 1).coerceIn(range)) }, contentDescription = "Decrease")
        Text(value.toString(), style = design.typography.headline)
        DSIconButton(Icons.Default.Add, onClick = { onValueChange((value + 1).coerceIn(range)) }, contentDescription = "Increase")
    }
}

@Composable
fun DSQuickActionTile(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val design = DS.current
    val c = design.colors
    Column(
        modifier = modifier
            .defaultMinSize(minHeight = design.tokens.mobileLayout.touchTarget.dp)
            .clip(RoundedCornerShape(DSComponentMetrics.QuickActionRadius))
            .border(1.dp, Color(c.line), RoundedCornerShape(DSComponentMetrics.QuickActionRadius))
            .background(Color(c.card))
            .clickable(role = Role.Button, onClick = onClick)
            .padding(vertical = 12.dp)
            .semantics { contentDescription = title },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color(c.primary), modifier = Modifier.size(DSComponentMetrics.StandardIcon))
        Text(title, style = design.typography.caption.copy(color = Color(c.inkBody)))
    }
}

@Composable
fun DSActivityRow(
    title: String,
    timestamp: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    icon: ImageVector,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val design = DS.current
    val c = design.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .padding(horizontal = design.tokens.mobileLayout.gutter.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(c.successLight)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = Color(c.primary), modifier = Modifier.size(17.dp))
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = design.typography.body.copy(fontWeight = FontWeight.SemiBold, color = Color(c.ink)))
            if (detail != null) {
                Text(detail, style = design.typography.caption.copy(color = Color(c.inkMuted)))
            }
        }
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(timestamp, style = design.typography.caption.copy(color = Color(c.inkMuted)))
            if (actionLabel != null && onAction != null) {
                Text(
                    actionLabel,
                    modifier = Modifier
                        .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
                        .clickable(role = Role.Button, onClick = onAction)
                        .semantics { contentDescription = actionLabel },
                    style = design.typography.caption.copy(fontWeight = FontWeight.SemiBold, color = Color(c.primary)),
                )
            }
        }
    }
}

@Composable
fun DSMultilineField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    maxLength: Int = 500,
) {
    val design = DS.current
    val c = design.colors
    val tokens = design.tokens
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = design.typography.label.copy(fontWeight = FontWeight.Medium, color = Color(c.inkBody)))
        BasicTextField(
            value = value,
            onValueChange = { onValueChange(it.take(maxLength)) },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = tokens.mobileLayout.fieldHeight.dp * 2)
                .clip(RoundedCornerShape(tokens.radius.control.dp))
                .border(1.dp, Color(c.line), RoundedCornerShape(tokens.radius.control.dp))
                .background(Color(c.card))
                .padding(12.dp)
                .semantics { contentDescription = label },
            textStyle = design.typography.body.copy(color = Color(c.ink)),
        )
        Text(
            "${value.length}/$maxLength",
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.End,
            style = design.typography.caption.copy(color = Color(c.inkMuted)),
        )
    }
}

package com.abe.design

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class AbeButtonVariant { Primary, Secondary, Ghost, Destructive }

@Composable
fun AbeButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: AbeButtonVariant = AbeButtonVariant.Primary,
    leadingIcon: ImageVector? = null,
    enabled: Boolean = true,
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    val touch = tokens.mobileLayout.touchTarget.dp
    val pill = RoundedCornerShape(tokens.radius.button.dp)
    val (bg, fg, border) = when (variant) {
        AbeButtonVariant.Primary -> Triple(Color(c.action), Color(c.actionForeground), null)
        AbeButtonVariant.Secondary -> Triple(Color(c.card), Color(c.ink), Color(c.line))
        AbeButtonVariant.Ghost -> Triple(Color.Transparent, Color(c.ink), null)
        AbeButtonVariant.Destructive -> Triple(Color(c.destructive), Color(c.destructiveForeground), null)
    }
    Row(
        modifier = modifier
            .defaultMinSize(minHeight = touch)
            .clip(pill)
            .then(if (border != null) Modifier.border(1.dp, border, pill) else Modifier)
            .background(bg)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = 22.dp)
            .semantics { contentDescription = label },
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (leadingIcon != null) {
            Icon(leadingIcon, contentDescription = null, tint = fg, modifier = Modifier.size(AbePenMetrics.IconSm))
            Spacer(Modifier.width(8.dp))
        }
        Text(label, style = design.typography.body.copy(fontWeight = FontWeight.SemiBold), color = fg)
    }
}

@Composable
fun AbeIconButton(
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    contentDescription: String,
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    val size = tokens.mobileLayout.touchTarget.dp
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .border(1.dp, Color(c.line), CircleShape)
            .background(Color(c.card))
            .clickable(role = Role.Button, onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = null, tint = Color(c.ink), modifier = Modifier.size(AbePenMetrics.IconMd))
    }
}

enum class AbeChipVariant { Neutral, Accent, Success, Warning, Error }

@Composable
fun AbeChip(
    label: String,
    modifier: Modifier = Modifier,
    variant: AbeChipVariant = AbeChipVariant.Neutral,
) {
    val design = Abe.current
    val c = design.colors
    val (bg, fg) = when (variant) {
        AbeChipVariant.Neutral -> Color(c.secondary) to Color(c.inkBody)
        AbeChipVariant.Accent -> Color(c.primary).copy(alpha = AbePenMetrics.TabActiveFillAlpha) to Color(c.primary)
        AbeChipVariant.Success -> Color(c.successLight) to Color(c.success)
        AbeChipVariant.Warning -> Color(c.warningLight) to Color(c.warning)
        AbeChipVariant.Error -> Color(c.errorLight) to Color(c.error)
    }
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(tokensRadiusFull(design.tokens)))
            .background(bg)
            .padding(horizontal = AbePenMetrics.ChipPaddingH, vertical = AbePenMetrics.ChipPaddingV)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            label,
            fontSize = AbePenMetrics.ChipLabelSize.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = design.typography.body.fontFamily,
            color = fg,
        )
    }
}

private fun tokensRadiusFull(tokens: AbeThemeTokens) = tokens.radius.full.dp

@Composable
fun AbeAvatar(
    initials: String,
    modifier: Modifier = Modifier,
    contentDescription: String = "Avatar $initials",
) {
    val design = Abe.current
    val c = design.colors
    Box(
        modifier = modifier
            .size(AbePenMetrics.AvatarSize)
            .clip(CircleShape)
            .background(Color(c.muted))
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            initials,
            style = design.typography.body.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            color = Color(c.primary),
        )
    }
}

@Composable
fun AbeListRow(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    showChevron: Boolean = true,
    onClick: (() -> Unit)? = null,
) {
    val design = Abe.current
    val c = design.colors
    val gap = design.tokens.mobileLayout.itemGap.dp
    val clickableMod = if (onClick != null) {
        Modifier.clickable(role = Role.Button, onClick = onClick)
    } else Modifier
    Row(
        modifier = modifier
            .fillMaxWidth()
            .then(clickableMod)
            .background(Color(c.card))
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .semantics(mergeDescendants = true) {
                contentDescription = if (subtitle != null) "$title, $subtitle" else title
                if (onClick != null) role = Role.Button
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(gap),
    ) {
        leading?.invoke()
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = design.typography.body.copy(fontWeight = FontWeight.SemiBold), color = Color(c.ink))
            if (subtitle != null) {
                Text(subtitle, style = design.typography.label.copy(fontWeight = FontWeight.Normal), color = Color(c.inkMuted))
            }
        }
        trailing?.invoke()
        if (showChevron) {
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color(c.inkMuted), modifier = Modifier.size(AbePenMetrics.IconSm))
        }
    }
}

enum class AbeStatTone { Default, Success, Warning, Error }

@Composable
fun AbeStatTile(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    meta: String? = null,
    metaTone: AbeStatTone = AbeStatTone.Default,
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    val metaColor = when (metaTone) {
        AbeStatTone.Default -> Color(c.inkMuted)
        AbeStatTone.Success -> Color(c.success)
        AbeStatTone.Warning -> Color(c.warning)
        AbeStatTone.Error -> Color(c.error)
    }
    Column(
        modifier = modifier
            .width(170.dp)
            .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
            .background(Color(c.card))
            .padding(16.dp)
            .semantics { contentDescription = "$label $value" },
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(label, style = design.typography.label.copy(fontWeight = FontWeight.Normal), color = Color(c.inkMuted))
        Text(
            value,
            style = design.typography.headline.copy(fontSize = AbePenMetrics.StatValueSize.sp, fontWeight = FontWeight.Medium),
            color = Color(c.ink),
        )
        if (meta != null) {
            Text(meta, fontSize = AbePenMetrics.ChipLabelSize.sp, fontWeight = FontWeight.Medium, fontFamily = design.typography.body.fontFamily, color = metaColor)
        }
    }
}

@Composable
fun AbeSegmentedControl(
    segments: List<String>,
    selectedIndex: Int,
    onSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val design = Abe.current
    val c = design.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(tokensRadiusFull(design.tokens)))
            .background(Color(c.secondary))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(0.dp),
    ) {
        segments.forEachIndexed { index, label ->
            val selected = index == selectedIndex
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(36.dp)
                    .clip(RoundedCornerShape(tokensRadiusFull(design.tokens)))
                    .then(
                        if (selected) {
                            Modifier
                                .shadow(1.dp, RoundedCornerShape(tokensRadiusFull(design.tokens)))
                                .background(Color(c.card))
                        } else Modifier,
                    )
                    .clickable(role = Role.Tab, onClick = { onSelected(index) })
                    .semantics { contentDescription = label; if (selected) role = Role.Tab },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    style = design.typography.label.copy(
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                    ),
                    color = if (selected) Color(c.ink) else Color(c.inkBody),
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
fun AbeField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = design.typography.label.copy(fontWeight = FontWeight.Medium), color = Color(c.inkBody))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(tokens.mobileLayout.fieldHeight.dp)
                .clip(RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
                .border(1.dp, Color(c.line), RoundedCornerShape(tokens.mobileLayout.cardRadius.dp))
                .background(Color(c.card))
                .padding(horizontal = 16.dp)
                .semantics { contentDescription = label },
            textStyle = design.typography.body.copy(fontSize = AbePenMetrics.FieldInputSize.sp, color = Color(c.ink)),
            decorationBox = { inner ->
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                    if (value.isEmpty() && placeholder.isNotEmpty()) {
                        Text(placeholder, style = design.typography.body, color = Color(c.inkMuted))
                    }
                    inner()
                }
            },
        )
    }
}

@Composable
fun AbeSearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Search",
) {
    val design = Abe.current
    val c = design.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(AbePenMetrics.SearchHeight)
            .clip(RoundedCornerShape(tokensRadiusFull(design.tokens)))
            .background(Color(c.secondary))
            .padding(horizontal = 14.dp)
            .semantics { contentDescription = placeholder },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(Icons.Default.Search, contentDescription = null, tint = Color(c.inkMuted), modifier = Modifier.size(AbePenMetrics.IconSm))
        BasicTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier.weight(1f),
            textStyle = design.typography.body.copy(color = Color(c.ink)),
            decorationBox = { inner ->
                Box(contentAlignment = Alignment.CenterStart) {
                    if (query.isEmpty()) {
                        Text(placeholder, style = design.typography.body, color = Color(c.inkMuted))
                    }
                    inner()
                }
            },
        )
    }
}

@Composable
fun AbeLargeTitle(
    title: String,
    modifier: Modifier = Modifier,
    eyebrow: String? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val design = Abe.current
    val c = design.colors
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (eyebrow != null) {
            Text(eyebrow, style = design.typography.label.copy(fontWeight = FontWeight.Medium), color = Color(c.inkMuted))
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Text(title, style = design.typography.title.copy(fontWeight = FontWeight.Medium), color = Color(c.ink))
            trailing?.invoke()
        }
    }
}

@Composable
fun AbeNavBar(
    title: String,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = {
        AbeIconButton(Icons.AutoMirrored.Filled.ArrowBack, onClick = {}, contentDescription = "Back")
    },
    trailing: (@Composable () -> Unit)? = {
        AbeIconButton(Icons.Default.MoreVert, onClick = {}, contentDescription = "More")
    },
) {
    val design = Abe.current
    val c = design.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Box(Modifier.width(design.tokens.mobileLayout.touchTarget.dp)) { leading?.invoke() }
        Text(
            title,
            fontSize = AbePenMetrics.NavTitleSize.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = design.typography.body.fontFamily,
            color = Color(c.ink),
        )
        Box(Modifier.width(design.tokens.mobileLayout.touchTarget.dp), contentAlignment = Alignment.CenterEnd) {
            trailing?.invoke()
        }
    }
}

@Composable
fun AbeSheetHandle(modifier: Modifier = Modifier) {
    val design = Abe.current
    val c = design.colors
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .size(AbePenMetrics.GrabberWidth, AbePenMetrics.GrabberHeight)
                .clip(RoundedCornerShape(3.dp))
                .background(Color(c.line)),
        )
    }
}

@Composable
fun AbeSectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val design = Abe.current
    val c = design.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            title,
            fontSize = AbePenMetrics.SectionTitleSize.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = design.typography.body.fontFamily,
            color = Color(c.ink),
        )
        if (actionLabel != null && onAction != null) {
            Text(
                actionLabel,
                modifier = Modifier
                    .clickable(role = Role.Button, onClick = onAction)
                    .semantics { contentDescription = actionLabel },
                style = design.typography.label,
                color = Color(c.primary),
            )
        }
    }
}

data class AbeTabItem(val label: String, val icon: ImageVector)

@Composable
fun AbeTabBar(
    items: List<AbeTabItem>,
    selectedIndex: Int,
    onSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    val capsuleShape = RoundedCornerShape(32.dp)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(AbePenMetrics.TabBarCapsuleHeight)
                .shadow(8.dp, capsuleShape)
                .clip(capsuleShape)
                .border(1.dp, Color(c.line), capsuleShape)
                .background(Color(c.card).copy(alpha = AbePenMetrics.TabBarCapsuleFillAlpha))
                .padding(6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEachIndexed { index, item ->
                val selected = index == selectedIndex
                val pill = RoundedCornerShape(tokens.radius.full.dp)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(pill)
                        .then(
                            if (selected) {
                                Modifier.background(Color(c.primary).copy(alpha = AbePenMetrics.TabActiveFillAlpha))
                            } else Modifier,
                        )
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            role = Role.Tab,
                            onClick = { onSelected(index) },
                        )
                        .padding(vertical = 6.dp, horizontal = 14.dp)
                        .semantics { contentDescription = item.label },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Icon(
                        item.icon,
                        contentDescription = null,
                        tint = if (selected) Color(c.primary) else Color(c.inkMuted),
                        modifier = Modifier.size(AbePenMetrics.IconLg),
                    )
                    Text(
                        item.label,
                        fontSize = AbePenMetrics.TabLabelSize.sp,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                        fontFamily = design.typography.body.fontFamily,
                        color = if (selected) Color(c.primary) else Color(c.inkMuted),
                    )
                }
            }
        }
    }
}

@Composable
fun AbeCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val design = Abe.current
    val c = design.colors
    val tokens = design.tokens
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(tokens.mobileLayout.cardRadius.dp),
        color = Color(c.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(c.line)),
        shadowElevation = 1.dp,
    ) {
        content()
    }
}

@Composable
fun AbeEmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val design = Abe.current
    val c = design.colors
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(design.tokens.mobileLayout.gutter.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(design.tokens.mobileLayout.itemGap.dp),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = Color(c.inkMuted), modifier = Modifier.size(48.dp))
        }
        Text(title, style = design.typography.headline, color = Color(c.ink), textAlign = TextAlign.Center)
        Text(message, style = design.typography.body, color = Color(c.inkMuted), textAlign = TextAlign.Center)
        if (actionLabel != null && onAction != null) {
            AbeButton(actionLabel, onClick = onAction, variant = AbeButtonVariant.Primary)
        }
    }
}

package com.abrahamjeyaraj.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import androidx.compose.ui.text.style.TextOverflow

@Immutable
data class DSButtonStyleColors(
    val background: Color,
    val foreground: Color,
    val border: Color?,
)

@Composable
fun dsButtonStyleColors(variant: DSButtonVariant): DSButtonStyleColors {
    val c = DS.current.colors
    return when (variant) {
        DSButtonVariant.Primary -> DSButtonStyleColors(Color(c.action), Color(c.actionForeground), null)
        DSButtonVariant.Secondary -> DSButtonStyleColors(Color(c.card), Color(c.foreground), Color(c.border))
        DSButtonVariant.Ghost -> DSButtonStyleColors(Color.Transparent, Color(c.foreground), null)
        DSButtonVariant.Destructive -> DSButtonStyleColors(Color(c.destructive), Color(c.destructiveForeground), null)
    }
}

@Composable
fun dsButtonLabelStyle(): androidx.compose.ui.text.TextStyle {
    val design = DS.current
    val label = design.tokens.label
    return design.typography.label.copy(
        fontSize = DSComponentMetrics.ButtonLabelSize,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = label.tracking.sp,
    )
}

@Composable
fun dsButtonLabelText(label: String, colors: DSButtonStyleColors, uppercase: Boolean) {
    val text = if (uppercase) label.uppercase() else label
    Text(
        text = text,
        style = dsButtonLabelStyle(),
        color = colors.foreground,
        textAlign = TextAlign.Center,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
    )
}

/** Primary action button chrome; pair with [dsButtonLabelText] or custom label content. Mirrors Swift `DSButtonStyle`. */
fun Modifier.dsButtonStyle(variant: DSButtonVariant, colors: DSButtonStyleColors): Modifier {
    val shape = RoundedCornerShape(DSComponentMetrics.ControlRadius)
    return this
        .defaultMinSize(minHeight = DSComponentMetrics.ButtonHeight)
        .clip(shape)
        .then(if (colors.border != null) Modifier.border(1.dp, colors.border, shape) else Modifier)
        .background(colors.background)
        .padding(horizontal = DSComponentMetrics.ButtonHPadding)
}

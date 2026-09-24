package com.abrahamjeyaraj.designsystem

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow

enum class DSTextStyle { Title, Headline, Body, Label, Caption }

@Composable
fun DSText(
    text: String,
    style: DSTextStyle,
    modifier: Modifier = Modifier,
    color: Color? = null,
    maxLines: Int = Int.MAX_VALUE,
) {
    val design = DS.current
    val c = design.colors
    val resolvedColor = color ?: when (style) {
        DSTextStyle.Title, DSTextStyle.Headline, DSTextStyle.Body -> Color(c.ink)
        DSTextStyle.Label -> Color(c.inkBody)
        DSTextStyle.Caption -> Color(c.inkMuted)
    }
    val textStyle = when (style) {
        DSTextStyle.Title -> design.typography.title
        DSTextStyle.Headline -> design.typography.headline
        DSTextStyle.Body -> design.typography.body
        DSTextStyle.Label -> design.typography.label
        DSTextStyle.Caption -> design.typography.caption
    }
    Text(
        text = text,
        modifier = modifier.semantics { },
        style = textStyle,
        color = resolvedColor,
        maxLines = maxLines,
        overflow = TextOverflow.Ellipsis,
    )
}

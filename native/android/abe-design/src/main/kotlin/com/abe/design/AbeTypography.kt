package com.abe.design

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow

enum class AbeTextStyle { Title, Headline, Body, Label, Caption }

@Composable
fun AbeText(
    text: String,
    style: AbeTextStyle,
    modifier: Modifier = Modifier,
    color: Color? = null,
    maxLines: Int = Int.MAX_VALUE,
) {
    val design = Abe.current
    val c = design.colors
    val resolvedColor = color ?: when (style) {
        AbeTextStyle.Title, AbeTextStyle.Headline, AbeTextStyle.Body -> Color(c.ink)
        AbeTextStyle.Label -> Color(c.inkBody)
        AbeTextStyle.Caption -> Color(c.inkMuted)
    }
    val textStyle = when (style) {
        AbeTextStyle.Title -> design.typography.title
        AbeTextStyle.Headline -> design.typography.headline
        AbeTextStyle.Body -> design.typography.body
        AbeTextStyle.Label -> design.typography.label
        AbeTextStyle.Caption -> design.typography.caption
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

import 'package:flutter/material.dart';

import 'ds_tokens.g.dart';
import 'theme.dart';

enum DSButtonVariant { primary, secondary, ghost, destructive }

enum DSChipTone { neutral, accent, success, warning, error }

enum DSStatTone { neutral, success, warning, error }

TextStyle _role(
  BuildContext context,
  DSTextRole role,
  int color, {
  bool heading = false,
}) {
  final theme = DSTheme.of(context);
  return TextStyle(
    fontFamily: theme.font(role.family, serif: heading),
    fontSize: role.size,
    height: role.lineHeight / role.size,
    fontWeight:
        FontWeight.values[((role.weight / 100).round() - 1).clamp(0, 8)],
    color: Color(color),
  );
}

/// Theme-driven type styles for the five mobile type roles.
class DSText extends StatelessWidget {
  const DSText(
    this.data, {
    super.key,
    this.style = DSTextStyle.body,
    this.maxLines,
    this.textAlign,
  });
  final String data;
  final DSTextStyle style;
  final int? maxLines;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final (role, color, heading) = switch (style) {
      DSTextStyle.title => (t.tokens.mobileType.title, t.colors.ink, true),
      DSTextStyle.headline => (
        t.tokens.mobileType.headline,
        t.colors.ink,
        true,
      ),
      DSTextStyle.body => (t.tokens.mobileType.body, t.colors.inkBody, false),
      DSTextStyle.label => (
        t.tokens.mobileType.label,
        t.colors.inkBody,
        false,
      ),
      DSTextStyle.caption => (
        t.tokens.mobileType.caption,
        t.colors.inkMuted,
        false,
      ),
    };
    return Text(
      data,
      maxLines: maxLines,
      textAlign: textAlign,
      textScaler: MediaQuery.textScalerOf(context),
      style: _role(context, role, color, heading: heading),
    );
  }
}

enum DSTextStyle { title, headline, body, label, caption }

class DSButton extends StatelessWidget {
  const DSButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = DSButtonVariant.primary,
    this.leadingIcon,
    this.semanticLabel,
  });
  final String label;
  final VoidCallback? onPressed;
  final DSButtonVariant variant;
  final IconData? leadingIcon;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    final background = switch (variant) {
      DSButtonVariant.primary => Color(c.action),
      DSButtonVariant.secondary => Color(c.card),
      DSButtonVariant.ghost => Colors.transparent,
      DSButtonVariant.destructive => Color(c.error),
    };
    final foreground = switch (variant) {
      DSButtonVariant.primary => c.actionForeground,
      DSButtonVariant.secondary || DSButtonVariant.ghost => c.ink,
      DSButtonVariant.destructive => c.errorLight,
    };
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leadingIcon != null) ...[
          Icon(leadingIcon, size: 18),
          SizedBox(width: t.tokens.mobileLayout.itemGap),
        ],
        Text(
          label,
          textScaler: MediaQuery.textScalerOf(context),
          style: _role(context, t.tokens.mobileType.body, foreground),
        ),
      ],
    );
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(t.tokens.radius.button),
      side: variant == DSButtonVariant.secondary
          ? BorderSide(color: Color(c.line))
          : BorderSide.none,
    );
    return Semantics(
      button: true,
      label: semanticLabel ?? label,
      child: ExcludeSemantics(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: t.tokens.mobileLayout.touchTarget,
          ),
          child: switch (variant) {
            DSButtonVariant.primary ||
            DSButtonVariant.destructive => FilledButton(
              onPressed: onPressed,
              style: FilledButton.styleFrom(
                backgroundColor: background,
                foregroundColor: Color(foreground),
                shape: shape,
                minimumSize: Size(0, t.tokens.mobileLayout.touchTarget),
              ),
              child: child,
            ),
            DSButtonVariant.secondary => OutlinedButton(
              onPressed: onPressed,
              style: OutlinedButton.styleFrom(
                backgroundColor: background,
                foregroundColor: Color(foreground),
                side: BorderSide(color: Color(c.line)),
                shape: shape,
                minimumSize: Size(0, t.tokens.mobileLayout.touchTarget),
              ),
              child: child,
            ),
            DSButtonVariant.ghost => TextButton(
              onPressed: onPressed,
              style: TextButton.styleFrom(
                foregroundColor: Color(foreground),
                minimumSize: Size(0, t.tokens.mobileLayout.touchTarget),
              ),
              child: child,
            ),
          },
        ),
      ),
    );
  }
}

class DSIconButton extends StatelessWidget {
  const DSIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
  });
  final IconData icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    return Semantics(
      button: true,
      label: semanticLabel,
      child: ExcludeSemantics(
        child: SizedBox.square(
          dimension: t.tokens.mobileLayout.touchTarget,
          child: IconButton(
            onPressed: onPressed,
            tooltip: semanticLabel,
            icon: Icon(icon, size: 20),
            style: IconButton.styleFrom(
              backgroundColor: Color(t.colors.card),
              foregroundColor: Color(t.colors.ink),
              side: BorderSide(color: Color(t.colors.line)),
            ),
          ),
        ),
      ),
    );
  }
}

class DSChip extends StatelessWidget {
  const DSChip({
    super.key,
    required this.label,
    this.tone = DSChipTone.neutral,
    this.icon,
  });
  final String label;
  final DSChipTone tone;
  final IconData? icon;
  @override
  Widget build(BuildContext context) {
    final c = DSTheme.of(context).colors;
    final (bg, fg, iconData) = switch (tone) {
      DSChipTone.neutral => (c.secondary, c.inkBody, Icons.label_outline),
      DSChipTone.accent => (c.primary, c.primaryForeground, Icons.bolt),
      DSChipTone.success => (
        c.successLight,
        c.success,
        Icons.check_circle_outline,
      ),
      DSChipTone.warning => (c.warningLight, c.warning, Icons.schedule),
      DSChipTone.error => (c.errorLight, c.error, Icons.error_outline),
    };
    return Semantics(
      label: '$label, ${tone.name}',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Color(bg),
            borderRadius: BorderRadius.circular(
              DSTheme.of(context).tokens.radius.full,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon ?? iconData, size: 18, color: Color(fg)),
              SizedBox(width: DSTheme.of(context).tokens.mobileLayout.itemGap),
              Text(
                label,
                textScaler: MediaQuery.textScalerOf(context),
                style:
                    _role(
                      context,
                      DSTheme.of(context).tokens.mobileType.caption,
                      fg,
                    ).copyWith(
                      fontWeight:
                          FontWeight.values[((DSTheme.of(
                                            context,
                                          ).tokens.mobileType.label.weight /
                                          100)
                                      .round() -
                                  1)
                              .clamp(0, 8)],
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DSAvatar extends StatelessWidget {
  const DSAvatar({super.key, required this.initials, this.semanticLabel});
  final String initials;
  final String? semanticLabel;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    return Semantics(
      image: true,
      label: semanticLabel ?? initials,
      child: ExcludeSemantics(
        child: CircleAvatar(
          radius: 20,
          backgroundColor: Color(t.colors.muted),
          child: Text(
            initials,
            textScaler: MediaQuery.textScalerOf(context),
            style: TextStyle(
              fontFamily: t.font(t.tokens.mobileType.label.family),
              color: Color(t.colors.primary),
              fontSize: t.tokens.mobileType.label.size,
              fontWeight:
                  FontWeight.values[((t.tokens.mobileType.label.weight / 100)
                              .round() -
                          1)
                      .clamp(0, 8)],
            ),
          ),
        ),
      ),
    );
  }
}

class DSListRow extends StatelessWidget {
  const DSListRow({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.showChevron = true,
  });
  final String title;
  final String? subtitle;
  final Widget? leading, trailing;
  final VoidCallback? onTap;
  final bool showChevron;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final row = Padding(
      padding: EdgeInsets.symmetric(
        horizontal: t.tokens.mobileLayout.gutter,
        vertical: t.tokens.mobileLayout.itemGap,
      ),
      child: Row(
        children: [
          if (leading != null) ...[
            leading!,
            SizedBox(width: t.tokens.mobileLayout.itemGap),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DSText(title, style: DSTextStyle.body),
                if (subtitle != null)
                  DSText(subtitle!, style: DSTextStyle.label),
              ],
            ),
          ),
          if (trailing != null) ...[
            trailing!,
            SizedBox(width: t.tokens.mobileLayout.itemGap),
          ],
          if (showChevron)
            Icon(
              Icons.chevron_right,
              size: 18,
              color: Color(t.colors.inkMuted),
            ),
        ],
      ),
    );
    return Material(
      color: Color(t.colors.card),
      child: onTap == null
          ? row
          : InkWell(
              onTap: onTap,
              child: Semantics(
                button: true,
                label: [title, if (subtitle != null) subtitle!].join(', '),
                child: ExcludeSemantics(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: t.tokens.mobileLayout.touchTarget,
                    ),
                    child: row,
                  ),
                ),
              ),
            ),
    );
  }
}

class DSStatTile extends StatelessWidget {
  const DSStatTile({
    super.key,
    required this.label,
    required this.value,
    this.meta,
    this.tone = DSStatTone.neutral,
  });
  final String label, value;
  final String? meta;
  final DSStatTone tone;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final int metaColor = switch (tone) {
      DSStatTone.neutral => t.colors.inkMuted,
      DSStatTone.success => t.colors.success,
      DSStatTone.warning => t.colors.warning,
      DSStatTone.error => t.colors.error,
    };
    return Container(
      padding: EdgeInsets.all(t.tokens.mobileLayout.gutter),
      decoration: BoxDecoration(
        color: Color(t.colors.card),
        border: Border.all(color: Color(t.colors.line)),
        borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DSText(label, style: DSTextStyle.label),
          Text(
            value,
            textScaler: MediaQuery.textScalerOf(context),
            style: TextStyle(
              fontFamily: t.font(t.tokens.mobileType.title.family, serif: true),
              fontSize: t.tokens.mobileType.headline.size,
              color: Color(t.colors.ink),
            ),
          ),
          if (meta != null)
            Text(
              meta!,
              style: _role(context, t.tokens.mobileType.caption, metaColor),
            ),
        ],
      ),
    );
  }
}

class DSSegmentedControl extends StatelessWidget {
  const DSSegmentedControl({
    super.key,
    required this.items,
    required this.selected,
    required this.onChanged,
  });
  final List<String> items;
  final int selected;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    return Semantics(
      container: true,
      label: 'Options',
      child: Container(
        padding: EdgeInsets.all(t.tokens.mobileLayout.itemGap / 3),
        decoration: BoxDecoration(
          color: Color(t.colors.secondary),
          borderRadius: BorderRadius.circular(t.tokens.radius.full),
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: Semantics(
                  button: true,
                  selected: i == selected,
                  label: items[i],
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: t.tokens.mobileLayout.touchTarget,
                    ),
                    child: TextButton(
                      onPressed: () => onChanged(i),
                      style: TextButton.styleFrom(
                        backgroundColor: i == selected
                            ? Color(t.colors.card)
                            : Colors.transparent,
                        foregroundColor: Color(
                          i == selected ? t.colors.ink : t.colors.inkBody,
                        ),
                        shape: const StadiumBorder(),
                        minimumSize: Size(0, t.tokens.mobileLayout.touchTarget),
                      ),
                      child: Text(
                        items[i],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class DSField extends StatelessWidget {
  const DSField({
    super.key,
    required this.label,
    this.controller,
    this.initialValue,
    this.hintText,
    this.onChanged,
    this.keyboardType,
  });
  final String label;
  final TextEditingController? controller;
  final String? initialValue, hintText;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DSText(label, style: DSTextStyle.label),
        SizedBox(height: t.tokens.mobileLayout.itemGap),
        SizedBox(
          height: t.tokens.mobileLayout.fieldHeight,
          child: TextFormField(
            controller: controller,
            initialValue: initialValue,
            onChanged: onChanged,
            keyboardType: keyboardType,
            decoration: InputDecoration(
              hintText: hintText,
              contentPadding: EdgeInsets.symmetric(
                horizontal: t.tokens.mobileLayout.gutter,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(t.tokens.radius.control),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(t.tokens.radius.control),
                borderSide: BorderSide(color: Color(t.colors.line)),
              ),
              filled: true,
              fillColor: Color(t.colors.card),
            ),
          ),
        ),
      ],
    );
  }
}

class DSSearchField extends StatelessWidget {
  const DSSearchField({
    super.key,
    this.hintText = 'Search',
    this.controller,
    this.onChanged,
  });
  final String hintText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  @override
  Widget build(BuildContext context) {
    final theme = DSTheme.of(context);
    final c = theme.colors;
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: Icon(Icons.search, size: 18, color: Color(c.inkMuted)),
        filled: true,
        fillColor: Color(c.secondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            DSTheme.of(context).tokens.radius.full,
          ),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: theme.tokens.mobileLayout.gutter,
        ),
        constraints: BoxConstraints(
          minHeight: theme.tokens.mobileLayout.touchTarget,
        ),
      ),
    );
  }
}

class DSLargeTitle extends StatelessWidget {
  const DSLargeTitle({
    super.key,
    this.eyebrow,
    required this.title,
    this.trailing,
  });
  final String? eyebrow;
  final String title;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) {
    final c = DSTheme.of(context).colors;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        DSTheme.of(context).tokens.mobileLayout.gutter,
        DSTheme.of(context).tokens.mobileLayout.itemGap,
        DSTheme.of(context).tokens.mobileLayout.gutter,
        DSTheme.of(context).tokens.mobileLayout.itemGap,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (eyebrow != null)
            Text(
              eyebrow!,
              style: _role(
                context,
                DSTheme.of(context).tokens.mobileType.label,
                c.inkMuted,
              ),
            ),
          Row(
            children: [
              Expanded(child: DSText(title, style: DSTextStyle.title)),
              if (trailing != null) trailing!,
            ],
          ),
        ],
      ),
    );
  }
}

class DSNavBar extends StatelessWidget {
  const DSNavBar({
    super.key,
    required this.title,
    this.leading,
    this.trailing,
  });
  final String title;
  final Widget? leading, trailing;
  @override
  Widget build(BuildContext context) => SizedBox(
    height: DSTheme.of(context).tokens.mobileLayout.controlHeight,
    child: Padding(
      padding: EdgeInsets.symmetric(
        horizontal: DSTheme.of(context).tokens.mobileLayout.gutter,
      ),
      child: Row(
        children: [
          if (leading != null) leading!,
          Expanded(
            child: Center(
              child: Text(
                title,
                style: TextStyle(
                  color: Color(DSTheme.of(context).colors.ink),
                  fontSize: DSTheme.of(context).tokens.mobileType.body.size,
                  fontWeight:
                      FontWeight.values[((DSTheme.of(
                                        context,
                                      ).tokens.mobileType.body.weight /
                                      100)
                                  .round() -
                              1)
                          .clamp(0, 8)],
                ),
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    ),
  );
}

class DSSheetHandle extends StatelessWidget {
  const DSSheetHandle({super.key});
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 20,
    child: Center(
      child: Container(
        width: 40,
        height: 5,
        decoration: BoxDecoration(
          color: Color(DSTheme.of(context).colors.line),
          borderRadius: BorderRadius.circular(3),
        ),
      ),
    ),
  );
}

class DSSectionHeader extends StatelessWidget {
  const DSSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.symmetric(
      horizontal: DSTheme.of(context).tokens.mobileLayout.gutter,
    ),
    child: Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              color: Color(DSTheme.of(context).colors.ink),
              fontSize: DSTheme.of(context).tokens.mobileType.headline.size,
              fontWeight:
                  FontWeight.values[((DSTheme.of(
                                    context,
                                  ).tokens.mobileType.headline.weight /
                                  100)
                              .round() -
                          1)
                      .clamp(0, 8)],
            ),
          ),
        ),
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              minimumSize: Size(
                0,
                DSTheme.of(context).tokens.mobileLayout.touchTarget,
              ),
            ),
            child: Text(actionLabel!),
          ),
      ],
    ),
  );
}

class DSTabItem {
  const DSTabItem({
    required this.label,
    required this.icon,
    this.semanticLabel,
  });
  final String label;
  final IconData icon;
  final String? semanticLabel;
}

class DSTabBar extends StatelessWidget {
  const DSTabBar({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onChanged,
  });
  final List<DSTabItem> items;
  final int selectedIndex;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    return Material(
      color: Colors.transparent,
      child: Container(
        margin: EdgeInsets.fromLTRB(
          t.tokens.mobileLayout.gutter,
          0,
          t.tokens.mobileLayout.gutter,
          t.tokens.mobileLayout.itemGap,
        ),
        padding: EdgeInsets.all(t.tokens.mobileLayout.itemGap / 2),
        decoration: BoxDecoration(
          color: Color(t.colors.card),
          border: Border.all(color: Color(t.colors.line)),
          borderRadius: BorderRadius.circular(t.tokens.radius.full),
          boxShadow: t.tokens.shadow.card
              .map(
                (layer) => BoxShadow(
                  offset: Offset(layer.x, layer.y),
                  blurRadius: layer.blur,
                  spreadRadius: layer.spread,
                  color: Color(t.colors.ink).withValues(alpha: layer.alpha),
                ),
              )
              .toList(),
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: Semantics(
                  button: true,
                  selected: i == selectedIndex,
                  label: items[i].semanticLabel ?? items[i].label,
                  child: InkWell(
                    onTap: () => onChanged(i),
                    borderRadius: BorderRadius.circular(t.tokens.radius.full),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: t.tokens.mobileLayout.touchTarget,
                      ),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: i == selectedIndex
                              ? Color(t.colors.primary).withValues(alpha: .1)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(
                            t.tokens.radius.full,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              items[i].icon,
                              size: 22,
                              color: Color(
                                i == selectedIndex
                                    ? t.colors.primary
                                    : t.colors.inkMuted,
                              ),
                            ),
                            Text(
                              items[i].label,
                              maxLines: 1,
                              softWrap: false,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Color(
                                  i == selectedIndex
                                      ? t.colors.primary
                                      : t.colors.inkMuted,
                                ),
                                fontSize: t.tokens.mobileType.caption.size,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class DSCard extends StatelessWidget {
  const DSCard({super.key, required this.child, this.padding, this.onTap});
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final content = Padding(
      padding: padding ?? EdgeInsets.all(t.tokens.mobileLayout.gutter),
      child: child,
    );
    return Card(
      color: Color(t.colors.card),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
        side: BorderSide(color: Color(t.colors.line)),
      ),
      child: onTap == null
          ? content
          : InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(
                t.tokens.mobileLayout.cardRadius,
              ),
              child: Semantics(
                button: true,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: t.tokens.mobileLayout.touchTarget,
                  ),
                  child: content,
                ),
              ),
            ),
    );
  }
}

class DSEmptyState extends StatelessWidget {
  const DSEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });
  final IconData icon;
  final String title, message;
  final Widget? action;
  @override
  Widget build(BuildContext context) {
    final c = DSTheme.of(context).colors;
    return Center(
      child: Padding(
        padding: EdgeInsets.all(
          DSTheme.of(context).tokens.mobileLayout.gutter,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: Color(c.inkMuted)),
            SizedBox(height: DSTheme.of(context).tokens.mobileLayout.itemGap),
            DSText(title, style: DSTextStyle.headline),
            SizedBox(height: DSTheme.of(context).tokens.mobileLayout.itemGap),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(c.inkBody)),
            ),
            if (action != null) ...[
              SizedBox(height: DSTheme.of(context).tokens.mobileLayout.gutter),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class DSStatusBar extends StatelessWidget {
  const DSStatusBar({
    super.key,
    required this.time,
    this.indicators = const [
      Icons.network_cell,
      Icons.wifi,
      Icons.battery_full,
    ],
  });
  final String time;
  final List<IconData> indicators;
  @override
  Widget build(BuildContext context) {
    final color = Color(DSTheme.of(context).colors.ink);
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: DSTheme.of(context).tokens.mobileLayout.gutter,
      ),
      child: SizedBox(
        height: DSTheme.of(context).tokens.mobileLayout.controlHeight,
        child: Row(
          children: [
            Text(
              time,
              style: TextStyle(
                color: color,
                fontSize: DSTheme.of(context).tokens.mobileType.body.size,
                fontWeight:
                    FontWeight.values[((DSTheme.of(
                                      context,
                                    ).tokens.mobileType.body.weight /
                                    100)
                                .round() -
                            1)
                        .clamp(0, 8)],
              ),
            ),
            const Spacer(),
            for (final icon in indicators)
              Padding(
                padding: EdgeInsets.only(
                  left: DSTheme.of(context).tokens.mobileLayout.itemGap / 2,
                ),
                child: Icon(icon, size: 18, color: color),
              ),
          ],
        ),
      ),
    );
  }
}

/// Shows every DS component in a compact scrollable specimen sheet.
class DSGallery extends StatefulWidget {
  const DSGallery({super.key});
  @override
  State<DSGallery> createState() => _DSGalleryState();
}

class _DSGalleryState extends State<DSGallery> {
  int _segment = 0, _tab = 0;
  @override
  Widget build(BuildContext context) => ListView(
    padding: EdgeInsets.all(DSTheme.of(context).tokens.mobileLayout.gutter),
    children: [
      const DSStatusBar(time: '9:41'),
      const DSSectionHeader(title: 'Typography'),
      const DSText('Title style', style: DSTextStyle.title),
      const DSText('Headline style', style: DSTextStyle.headline),
      const DSText('Body style', style: DSTextStyle.body),
      const DSText('Label style', style: DSTextStyle.label),
      const DSText('Caption style', style: DSTextStyle.caption),
      DSLargeTitle(
        eyebrow: 'Friday, 19 September',
        title: 'Today',
        trailing: DSIconButton(
          icon: Icons.add,
          semanticLabel: 'Add',
          onPressed: () {},
        ),
      ),
      const DSSectionHeader(title: 'Buttons'),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final v in DSButtonVariant.values)
            DSButton(label: v.name, variant: v, onPressed: () {}),
        ],
      ),
      const DSSectionHeader(title: 'Chips'),
      const Wrap(
        spacing: 8,
        children: [
          DSChip(label: 'Class 10'),
          DSChip(label: 'Active', tone: DSChipTone.accent),
          DSChip(label: 'Paid', tone: DSChipTone.success),
          DSChip(label: 'Due', tone: DSChipTone.warning),
          DSChip(label: 'Overdue', tone: DSChipTone.error),
        ],
      ),
      const DSSectionHeader(title: 'Profile'),
      const DSCard(
        child: DSListRow(
          title: 'Ananya Raghavan',
          subtitle: 'Class 10 · Maths, Physics',
          leading: DSAvatar(initials: 'AR'),
          trailing: DSChip(label: 'Paid', tone: DSChipTone.success),
        ),
      ),
      const DSSectionHeader(title: 'Statistics'),
      const DSStatTile(
        label: 'Collected',
        value: '₹3,84,000',
        meta: '+12% vs Aug',
        tone: DSStatTone.success,
      ),
      const DSSectionHeader(title: 'Filters'),
      DSSegmentedControl(
        items: const ['All', 'Due', 'Overdue', 'Paid'],
        selected: _segment,
        onChanged: (i) => setState(() => _segment = i),
      ),
      const DSSectionHeader(title: 'Fields'),
      const DSField(label: 'Amount', initialValue: '₹12,000'),
      const DSSearchField(hintText: 'Search students'),
      const DSSectionHeader(title: 'Navigation'),
      DSNavBar(
        title: 'Student',
        leading: DSIconButton(
          icon: Icons.arrow_back,
          semanticLabel: 'Back',
          onPressed: () {},
        ),
        trailing: DSIconButton(
          icon: Icons.more_horiz,
          semanticLabel: 'More',
          onPressed: () {},
        ),
      ),
      const DSSheetHandle(),
      DSTabBar(
        items: const [
          DSTabItem(label: 'Today', icon: Icons.today),
          DSTabItem(label: 'Students', icon: Icons.people),
          DSTabItem(label: 'Fees', icon: Icons.payments),
          DSTabItem(label: 'Classes', icon: Icons.class_),
          DSTabItem(label: 'More', icon: Icons.more_horiz),
        ],
        selectedIndex: _tab,
        onChanged: (i) => setState(() => _tab = i),
      ),
      const DSSectionHeader(title: 'Empty state', actionLabel: 'See all'),
      const DSEmptyState(
        icon: Icons.inbox_outlined,
        title: 'Nothing due',
        message: 'You are all caught up.',
      ),
    ],
  );
}

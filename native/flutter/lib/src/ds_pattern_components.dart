part of 'components.dart';

class DSPatternMetrics {
  static const weekCellRadius = 14.0;
  static const loadDotSize = 4.0;
  static const countPillHeight = 36.0;
  static const presetTileHeight = 64.0;
  static const quickActionRadius = 14.0;
  static const timelineGutterWidth = 44.0;
  static const markToggleSize = 48.0;
  static const markIconSize = 22.0;
  static const quickActionIconSize = 20.0;
  static const activityGlyphSize = 17.0;
  static const activityAvatarRadius = 18.0;
}

class DSSnackbarBar extends StatelessWidget {
  const DSSnackbarBar({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
  });
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      label: message,
      container: true,
      child: Material(
        color: Color(c.ink900),
        borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  message,
                  style: _role(context, t.tokens.mobileType.body, c.onInk),
                ),
              ),
              if (actionLabel != null && onAction != null)
                TextButton(
                  onPressed: onAction,
                  style: TextButton.styleFrom(
                    minimumSize: Size(t.tokens.mobileLayout.touchTarget, t.tokens.mobileLayout.touchTarget),
                  ),
                  child: Text(
                    actionLabel!,
                    style: _role(context, t.tokens.mobileType.label, c.onInkAccent).copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class DSWeekStripDay {
  const DSWeekStripDay({
    required this.id,
    required this.weekdaySymbol,
    required this.dayNumber,
    this.loadCount = 0,
  });
  final String id;
  final String weekdaySymbol;
  final int dayNumber;
  final int loadCount;
}

class DSWeekStrip extends StatelessWidget {
  const DSWeekStrip({
    super.key,
    required this.days,
    required this.selectedDayId,
    required this.onSelect,
    this.todayDayId,
  });
  final List<DSWeekStripDay> days;
  final String selectedDayId;
  final String? todayDayId;
  final ValueChanged<DSWeekStripDay> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Row(
      children: [
        for (final day in days) ...[
          Expanded(
            child: Semantics(
              button: true,
              selected: day.id == selectedDayId,
              label: '${day.weekdaySymbol} ${day.dayNumber}',
              child: InkWell(
                onTap: () => onSelect(day),
                borderRadius: BorderRadius.circular(DSPatternMetrics.weekCellRadius),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: Color(day.id == selectedDayId ? c.action : c.card),
                    borderRadius: BorderRadius.circular(DSPatternMetrics.weekCellRadius),
                    border: day.id == todayDayId && day.id != selectedDayId
                        ? Border.all(color: Color(c.primary))
                        : null,
                  ),
                  child: Column(
                    children: [
                      DSText(day.weekdaySymbol, style: DSTextStyle.caption),
                      DSText('${day.dayNumber}', style: DSTextStyle.body),
                      SizedBox(
                        height: DSPatternMetrics.loadDotSize,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (var i = 0; i < day.loadCount.clamp(0, 4); i++)
                              Container(
                                width: DSPatternMetrics.loadDotSize,
                                height: DSPatternMetrics.loadDotSize,
                                margin: const EdgeInsets.symmetric(horizontal: 1),
                                decoration: BoxDecoration(
                                  color: Color(day.id == selectedDayId ? c.actionForeground : c.accent2),
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (day != days.last) const SizedBox(width: 6),
        ],
      ],
    );
  }
}

enum DSTimelineRowState { past, live, upcoming }

class DSTimelineRow extends StatelessWidget {
  const DSTimelineRow({
    super.key,
    required this.timeStart,
    required this.timeEnd,
    required this.state,
    required this.content,
    this.footer,
  });
  final String timeStart;
  final String timeEnd;
  final DSTimelineRowState state;
  final Widget content;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    final live = state == DSTimelineRowState.live;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: DSPatternMetrics.timelineGutterWidth,
          child: Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DSText(timeStart, style: DSTextStyle.label),
                DSText(timeEnd, style: DSTextStyle.caption),
              ],
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Color(live ? c.ink900 : c.card),
              borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
              border: live ? null : Border.all(color: Color(c.line)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DefaultTextStyle.merge(
                  style: TextStyle(color: Color(live ? c.onInk : c.ink)),
                  child: content,
                ),
                if (footer != null) ...[const SizedBox(height: 10), footer!],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class DSCountPill extends StatelessWidget {
  const DSCountPill({
    super.key,
    required this.symbol,
    required this.count,
    required this.onPressed,
    this.semanticLabel,
  });
  final String symbol;
  final int count;
  final VoidCallback onPressed;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      button: true,
      label: semanticLabel ?? '$symbol $count',
      child: Material(
        color: Color(c.muted),
        borderRadius: BorderRadius.circular(t.tokens.radius.full),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(t.tokens.radius.full),
          child: SizedBox(
            height: DSPatternMetrics.countPillHeight,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DSText(symbol, style: DSTextStyle.body),
                  const SizedBox(width: 4),
                  DSText('$count', style: DSTextStyle.body),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DSPodiumEntry {
  const DSPodiumEntry({
    required this.id,
    required this.name,
    required this.value,
    required this.columnHeight,
    this.isLeader = false,
  });
  final String id;
  final String name;
  final String value;
  final double columnHeight;
  final bool isLeader;
}

class DSPodium extends StatelessWidget {
  const DSPodium({super.key, required this.entries, required this.avatarBuilder});
  final List<DSPodiumEntry> entries;
  final Widget Function(DSPodiumEntry entry) avatarBuilder;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (final entry in entries) ...[
          Expanded(
            child: Semantics(
              label: '${entry.name}, ${entry.value}',
              child: Container(
                height: entry.columnHeight,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                decoration: BoxDecoration(
                  color: Color(entry.isLeader ? c.ink900 : c.card),
                  borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
                  border: entry.isLeader ? null : Border.all(color: Color(c.line)),
                ),
                alignment: Alignment.bottomCenter,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(width: 32, height: 32, child: Center(child: avatarBuilder(entry))),
                      const SizedBox(height: 4),
                      Text(
                        entry.name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        style: _role(
                          context,
                          t.tokens.mobileType.body,
                          entry.isLeader ? c.onInk : c.ink,
                        ).copyWith(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        entry.value,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        style: _role(context, t.tokens.mobileType.caption, entry.isLeader ? c.onInkAccent : c.inkMuted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (entry != entries.last) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class DSMarkToggle extends StatelessWidget {
  const DSMarkToggle({
    super.key,
    required this.marked,
    required this.onChanged,
    required this.semanticLabel,
  });
  final bool marked;
  final ValueChanged<bool> onChanged;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      button: true,
      label: semanticLabel,
      value: marked ? 'On' : 'Off',
      child: Material(
        color: Color(marked ? c.successLight : c.error),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => onChanged(!marked),
          child: SizedBox(
            width: DSPatternMetrics.markToggleSize,
            height: DSPatternMetrics.markToggleSize,
            child: Icon(
              marked ? Icons.check : Icons.close,
              color: Color(marked ? c.success : c.destructiveForeground),
              size: DSPatternMetrics.markIconSize,
            ),
          ),
        ),
      ),
    );
  }
}

class DSSummaryItem {
  const DSSummaryItem(this.label, this.value, {this.tone = DSStatTone.neutral});
  final String label;
  final String value;
  final DSStatTone tone;
}

class DSSummaryBar extends StatelessWidget {
  const DSSummaryBar({super.key, required this.items});
  final List<DSSummaryItem> items;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    int valueColor(DSStatTone tone) => switch (tone) {
      DSStatTone.success => c.success,
      DSStatTone.warning => c.warning,
      DSStatTone.error => c.error,
      _ => c.ink,
    };
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Color(c.card),
        borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
        border: Border.all(color: Color(c.line)),
      ),
      child: Row(
        children: [
          for (final item in items)
            Expanded(
              child: Column(
                children: [
                  Text(
                    item.value,
                    style: _role(context, t.tokens.mobileType.headline, valueColor(item.tone)).copyWith(fontWeight: FontWeight.w600),
                  ),
                  DSText(item.label, style: DSTextStyle.caption),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class DSPresetOption {
  const DSPresetOption(this.id, this.label);
  final String id;
  final String label;
}

class DSPresetGrid extends StatelessWidget {
  const DSPresetGrid({
    super.key,
    required this.options,
    required this.selectedId,
    required this.onSelect,
  });
  final List<DSPresetOption> options;
  final String? selectedId;
  final ValueChanged<DSPresetOption> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Row(
      children: [
        for (final option in options) ...[
          Expanded(
            child: Semantics(
              button: true,
              selected: option.id == selectedId,
              label: option.label,
              child: InkWell(
                onTap: () => onSelect(option),
                borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
                child: Container(
                  height: DSPatternMetrics.presetTileHeight,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Color(option.id == selectedId ? c.action : c.card),
                    borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
                    border: option.id == selectedId ? null : Border.all(color: Color(c.line)),
                  ),
                  child: Text(
                    option.label,
                    style: _role(
                      context,
                      t.tokens.mobileType.headline,
                      option.id == selectedId ? c.actionForeground : c.ink,
                    ).copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ),
          if (option != options.last) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class DSStepper extends StatelessWidget {
  const DSStepper({
    super.key,
    required this.value,
    required this.onChanged,
    required this.min,
    required this.max,
    this.semanticLabel = 'Value stepper',
  });
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      label: semanticLabel,
      value: '$value',
      child: Container(
        height: DSPatternMetrics.presetTileHeight,
        padding: EdgeInsets.symmetric(horizontal: t.tokens.mobileLayout.gutter),
        decoration: BoxDecoration(
          color: Color(c.card),
          borderRadius: BorderRadius.circular(t.tokens.mobileLayout.cardRadius),
          border: Border.all(color: Color(c.line)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            DSIconButton(
              icon: Icons.remove,
              semanticLabel: 'Decrease',
              onPressed: value > min ? () => onChanged(value - 1) : null,
            ),
            DSText('$value', style: DSTextStyle.headline),
            DSIconButton(
              icon: Icons.add,
              semanticLabel: 'Increase',
              onPressed: value < max ? () => onChanged(value + 1) : null,
            ),
          ],
        ),
      ),
    );
  }
}

class DSQuickActionTile extends StatelessWidget {
  const DSQuickActionTile({
    super.key,
    required this.title,
    required this.icon,
    required this.onPressed,
  });
  final String title;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      button: true,
      label: title,
      child: Material(
        color: Color(c.card),
        borderRadius: BorderRadius.circular(DSPatternMetrics.quickActionRadius),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(DSPatternMetrics.quickActionRadius),
          child: Container(
            constraints: BoxConstraints(minHeight: t.tokens.mobileLayout.touchTarget),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(DSPatternMetrics.quickActionRadius),
              border: Border.all(color: Color(c.line)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Color(c.primary), size: DSPatternMetrics.quickActionIconSize),
                const SizedBox(height: 6),
                DSText(title, style: DSTextStyle.caption),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DSActivityRow extends StatelessWidget {
  const DSActivityRow({
    super.key,
    required this.title,
    required this.timestamp,
    required this.icon,
    this.detail,
    this.actionLabel,
    this.onAction,
  });
  final String title;
  final String? detail;
  final String timestamp;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Semantics(
      label: '$title, $timestamp',
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 52),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: t.tokens.mobileLayout.gutter),
          child: Row(
            children: [
              CircleAvatar(
                radius: DSPatternMetrics.activityAvatarRadius,
                backgroundColor: Color(c.successLight),
                child: Icon(icon, size: DSPatternMetrics.activityGlyphSize, color: Color(c.primary)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    DSText(title, style: DSTextStyle.body),
                    if (detail != null) DSText(detail!, style: DSTextStyle.caption),
                  ],
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  DSText(timestamp, style: DSTextStyle.caption),
                  if (actionLabel != null && onAction != null)
                    TextButton(
                      onPressed: onAction,
                      style: TextButton.styleFrom(
                        minimumSize: const Size(48, 48),
                        padding: EdgeInsets.zero,
                      ),
                      child: Text(
                        actionLabel!,
                        style: _role(context, t.tokens.mobileType.caption, c.primary).copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DSMultilineField extends StatefulWidget {
  const DSMultilineField({
    super.key,
    required this.label,
    this.initialValue = '',
    this.maxLength = 500,
    this.onChanged,
  });
  final String label;
  final String initialValue;
  final int maxLength;
  final ValueChanged<String>? onChanged;

  @override
  State<DSMultilineField> createState() => _DSMultilineFieldState();
}

class _DSMultilineFieldState extends State<DSMultilineField> {
  late final TextEditingController _controller = TextEditingController(text: widget.initialValue);

  @override
  Widget build(BuildContext context) {
    final t = DSTheme.of(context);
    final c = t.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DSText(widget.label, style: DSTextStyle.label),
        const SizedBox(height: 6),
        TextField(
          controller: _controller,
          maxLines: 4,
          maxLength: widget.maxLength,
          onChanged: (v) {
            setState(() {});
            widget.onChanged?.call(v);
          },
          decoration: InputDecoration(
            filled: true,
            fillColor: Color(c.card),
            counterText: '',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(t.tokens.radius.control)),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: DSText('${_controller.text.length}/${widget.maxLength}', style: DSTextStyle.caption),
        ),
      ],
    );
  }
}

#if canImport(SwiftUI)
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Pen v2 metrics (fixed sizes from tuition-manager.pen)

public enum DSPenV2Metrics {
    public static let weekCellRadius: CGFloat = 14
    public static let loadDotSize: CGFloat = 4
    public static let countPillHeight: CGFloat = 36
    public static let presetTileHeight: CGFloat = 64
    public static let quickActionRadius: CGFloat = 14
    public static let timelineGutterWidth: CGFloat = 44
    public static let markToggleSize: CGFloat = 48
    public static let markIconSize: CGFloat = 22
    public static let podiumHeights: [CGFloat] = [120, 150, 104]
}

// MARK: - Snackbar

public struct DSSnackbarAction: Sendable {
    public let title: String
    public let handler: @Sendable () -> Void
    public init(title: String, handler: @escaping @Sendable () -> Void) {
        self.title = title
        self.handler = handler
    }
}

@MainActor
public final class DSSnackbarPresenter: ObservableObject {
    @Published public private(set) var message: String?
    @Published public private(set) var action: DSSnackbarAction?
    private var dismissTask: Task<Void, Never>?

    public init() {}

    public func show(message: String, action: DSSnackbarAction? = nil, duration: TimeInterval = 5) {
        dismissTask?.cancel()
        self.message = message
        self.action = action
#if canImport(UIKit)
        UIAccessibility.post(notification: .announcement, argument: message)
#endif
        dismissTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            if !Task.isCancelled { dismiss() }
        }
    }

    public func dismiss() {
        dismissTask?.cancel()
        message = nil
        action = nil
    }
}

private struct DSSnackbarPresenterKey: EnvironmentKey {
    static let defaultValue: DSSnackbarPresenter? = nil
}

public extension EnvironmentValues {
    var dsSnackbarPresenter: DSSnackbarPresenter? {
        get { self[DSSnackbarPresenterKey.self] }
        set { self[DSSnackbarPresenterKey.self] = newValue }
    }
}

public struct DSSnackbarHost<Content: View>: View {
    @StateObject private var presenter = DSSnackbarPresenter()
    @ViewBuilder public let content: Content

    public init(@ViewBuilder content: () -> Content) { self.content = content() }

    public var body: some View {
        content.environment(\.dsSnackbarPresenter, presenter)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if let message = presenter.message {
                    DSSnackbarBar(message: message, action: presenter.action) {
                        presenter.dismiss()
                    }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .padding(.horizontal, DSTokens.Spacing.s4)
                    .padding(.bottom, DSTokens.Spacing.s3)
                }
            }
            .animation(.easeInOut(duration: 0.2), value: presenter.message)
    }
}

public struct DSSnackbarBar: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let message: String
    public let action: DSSnackbarAction?
    public let onDismiss: () -> Void

    public init(message: String, action: DSSnackbarAction? = nil, onDismiss: @escaping () -> Void = {}) {
        self.message = message
        self.action = action
        self.onDismiss = onDismiss
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: DSTokens.Spacing.s3) {
            Text(message).dsFont(.body).fontWeight(.medium).foregroundStyle(Color(dsHex: c.onInk))
                .frame(maxWidth: .infinity, alignment: .leading)
            if let action {
                Button(action.title) {
                    action.handler()
                    onDismiss()
                }
                .buttonStyle(.plain)
                .dsFont(.label).fontWeight(.semibold)
                .foregroundStyle(Color(dsHex: c.onInkAccent))
                .frame(minWidth: theme.mobileLayout.touchTarget, minHeight: 44)
                .accessibilityLabel(action.title)
            }
        }
        .padding(.horizontal, DSTokens.Spacing.s4)
        .padding(.vertical, DSTokens.Spacing.s3)
        .background(Color(dsHex: c.ink900), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
    }
}

// MARK: - Week strip

public struct DSWeekStripDay: Identifiable, Sendable, Equatable {
    public let id: String
    public let weekdaySymbol: String
    public let dayNumber: Int
    public let loadCount: Int
    public init(id: String, weekdaySymbol: String, dayNumber: Int, loadCount: Int = 0) {
        self.id = id
        self.weekdaySymbol = weekdaySymbol
        self.dayNumber = dayNumber
        self.loadCount = loadCount
    }
}

public struct DSWeekStrip: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let days: [DSWeekStripDay]
    public let selectedDayID: String
    public let todayDayID: String?
    public let onSelect: (DSWeekStripDay) -> Void

    public init(days: [DSWeekStripDay], selectedDayID: String, todayDayID: String? = nil, onSelect: @escaping (DSWeekStripDay) -> Void) {
        self.days = days
        self.selectedDayID = selectedDayID
        self.todayDayID = todayDayID
        self.onSelect = onSelect
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 6) {
            ForEach(days) { day in
                let selected = day.id == selectedDayID
                let isToday = day.id == todayDayID
                Button { onSelect(day) } label: {
                    VStack(spacing: 4) {
                        Text(day.weekdaySymbol).dsFont(.caption).fontWeight(.medium)
                            .foregroundStyle(Color(dsHex: selected ? c.actionForeground : c.inkMuted))
                        Text("\(day.dayNumber)").dsFont(.body).fontWeight(.semibold)
                            .foregroundStyle(Color(dsHex: selected ? c.actionForeground : c.foreground))
                        HStack(spacing: 2) {
                            ForEach(0..<min(day.loadCount, 4), id: \.self) { _ in
                                Circle()
                                    .fill(Color(dsHex: selected ? c.actionForeground : c.accent2))
                                    .frame(width: DSPenV2Metrics.loadDotSize, height: DSPenV2Metrics.loadDotSize)
                            }
                        }
                        .frame(height: DSPenV2Metrics.loadDotSize)
                    }
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity)
                    .background(
                        Color(dsHex: selected ? c.action : c.card),
                        in: RoundedRectangle(cornerRadius: DSPenV2Metrics.weekCellRadius)
                    )
                    .overlay {
                        if isToday && !selected {
                            RoundedRectangle(cornerRadius: DSPenV2Metrics.weekCellRadius)
                                .stroke(Color(dsHex: c.primary), lineWidth: 1)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(day.weekdaySymbol) \(day.dayNumber)")
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
    }
}

// MARK: - Timeline row

public enum DSTimelineRowState: Sendable { case past, live, upcoming }

public struct DSTimelineRow<Content: View, Footer: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let timeStart: String
    public let timeEnd: String
    public let state: DSTimelineRowState
    @ViewBuilder public let content: Content
    @ViewBuilder public let footer: Footer

    public init(
        timeStart: String,
        timeEnd: String,
        state: DSTimelineRowState,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer = { EmptyView() }
    ) {
        self.timeStart = timeStart
        self.timeEnd = timeEnd
        self.state = state
        self.content = content()
        self.footer = footer()
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        let cardFill: UInt32 = state == .live ? c.ink900 : c.card
        let primaryInk: UInt32 = state == .live ? c.onInk : c.foreground
        let mutedInk: UInt32 = state == .live ? c.onInkMuted : c.inkMuted
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 2) {
                Text(timeStart).dsFont(.label).fontWeight(.semibold).foregroundStyle(Color(dsHex: primaryInk))
                Text(timeEnd).dsFont(.caption).foregroundStyle(Color(dsHex: mutedInk))
            }
            .frame(width: DSPenV2Metrics.timelineGutterWidth, alignment: .leading)
            .padding(.top, 14)
            .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 10) {
                content.foregroundStyle(Color(dsHex: primaryInk))
                footer
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(dsHex: cardFill), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
            .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: state == .live ? 0 : 1))
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(timeStart) to \(timeEnd)")
    }
}

// MARK: - Count pill

public struct DSCountPill: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let symbol: String
    public let count: Int
    public let accessibilityLabel: String
    public let action: () -> Void

    public init(symbol: String, count: Int, accessibilityLabel: String? = nil, action: @escaping () -> Void) {
        self.symbol = symbol
        self.count = count
        self.accessibilityLabel = accessibilityLabel ?? "\(symbol) \(count)"
        self.action = action
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        Button(action: action) {
            HStack(spacing: 4) {
                Text(symbol).dsFont(.body).fontWeight(.semibold)
                Text("\(count)").dsFont(.body).fontWeight(.semibold)
            }
            .foregroundStyle(Color(dsHex: c.ink))
            .padding(.horizontal, 12)
            .frame(height: DSPenV2Metrics.countPillHeight)
            .background(Color(dsHex: c.muted), in: Capsule())
        }
        .buttonStyle(DSCountPillButtonStyle())
        .accessibilityLabel(accessibilityLabel)
        .accessibilityAddTraits(.isButton)
    }
}

private struct DSCountPillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(configuration.isPressed ? 0.75 : 1)
    }
}

// MARK: - Podium

public struct DSPodiumEntry: Identifiable, Sendable, Equatable {
    public let id: String
    public let name: String
    public let value: String
    public let columnHeight: CGFloat
    public let isLeader: Bool
    public init(id: String, name: String, value: String, columnHeight: CGFloat, isLeader: Bool = false) {
        self.id = id
        self.name = name
        self.value = value
        self.columnHeight = columnHeight
        self.isLeader = isLeader
    }
}

public struct DSPodium<Avatar: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let entries: [DSPodiumEntry]
    @ViewBuilder public let avatar: (DSPodiumEntry) -> Avatar

    public init(entries: [DSPodiumEntry], @ViewBuilder avatar: @escaping (DSPodiumEntry) -> Avatar) {
        self.entries = entries
        self.avatar = avatar
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(alignment: .bottom, spacing: 10) {
            ForEach(entries) { entry in
                let fill: UInt32 = entry.isLeader ? c.ink900 : c.card
                let title: UInt32 = entry.isLeader ? c.onInk : c.foreground
                let meta: UInt32 = entry.isLeader ? c.onInkAccent : c.inkMuted
                VStack(spacing: 6) {
                    avatar(entry)
                    Text(entry.name).dsFont(.body).fontWeight(.semibold).foregroundStyle(Color(dsHex: title))
                    Text(entry.value).dsFont(.caption).foregroundStyle(Color(dsHex: meta))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .frame(height: entry.columnHeight, alignment: .bottom)
                .background(Color(dsHex: fill), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
                .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: entry.isLeader ? 0 : 1))
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(entry.name), \(entry.value)")
            }
        }
    }
}

// MARK: - Mark toggle

public struct DSMarkToggle: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @Binding public var isMarked: Bool
    public let accessibilityLabel: String

    public init(isMarked: Binding<Bool>, accessibilityLabel: String = "Attendance mark") {
        self._isMarked = isMarked
        self.accessibilityLabel = accessibilityLabel
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        Button { isMarked.toggle() } label: {
            Image(systemName: isMarked ? "checkmark" : "xmark")
                .font(.system(size: DSPenV2Metrics.markIconSize, weight: .semibold))
                .foregroundStyle(Color(dsHex: isMarked ? c.success : c.destructiveForeground))
                .frame(width: DSPenV2Metrics.markToggleSize, height: DSPenV2Metrics.markToggleSize)
                .background(Color(dsHex: isMarked ? c.successLight : c.error), in: Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue(isMarked ? "Present" : "Absent")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Summary bar

public struct DSSummaryItem: Sendable, Equatable {
    public let label: String
    public let value: String
    public let tone: DSStatTone
    public init(label: String, value: String, tone: DSStatTone = .neutral) {
        self.label = label
        self.value = value
        self.tone = tone
    }
}

public struct DSSummaryBar: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let items: [DSSummaryItem]

    public init(items: [DSSummaryItem]) { self.items = items }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                VStack(spacing: 2) {
                    Text(item.value).dsFont(.headline).fontWeight(.semibold)
                        .foregroundStyle(Color(dsHex: toneColor(item.tone, colors: c)))
                    Text(item.label).dsFont(.caption).foregroundStyle(Color(dsHex: c.inkMuted))
                }
                .frame(maxWidth: .infinity)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(item.label) \(item.value)")
            }
        }
        .padding(.vertical, 14)
        .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
        .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: 1))
    }

    private func toneColor(_ tone: DSStatTone, colors c: DSColorScheme) -> UInt32 {
        switch tone {
        case .success: c.success
        case .warning: c.warning
        case .error: c.error
        case .neutral: c.foreground
        }
    }
}

// MARK: - Preset grid & stepper

public struct DSPresetOption: Identifiable, Sendable, Equatable {
    public let id: String
    public let label: String
    public init(id: String, label: String) { self.id = id; self.label = label }
}

public struct DSPresetGrid: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let options: [DSPresetOption]
    public let selectedID: String?
    public let onSelect: (DSPresetOption) -> Void

    public init(options: [DSPresetOption], selectedID: String?, onSelect: @escaping (DSPresetOption) -> Void) {
        self.options = options
        self.selectedID = selectedID
        self.onSelect = onSelect
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 10) {
            ForEach(options) { option in
                let selected = option.id == selectedID
                Button { onSelect(option) } label: {
                    Text(option.label).dsFont(.headline).fontWeight(.semibold)
                        .foregroundStyle(Color(dsHex: selected ? c.actionForeground : c.foreground))
                        .frame(maxWidth: .infinity)
                        .frame(height: DSPenV2Metrics.presetTileHeight)
                        .background(Color(dsHex: selected ? c.action : c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
                        .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: selected ? 0 : 1))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(option.label)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
    }
}

public struct DSStepper: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @Binding public var value: Int
    public let range: ClosedRange<Int>
    public let accessibilityLabel: String

    public init(value: Binding<Int>, in range: ClosedRange<Int>, accessibilityLabel: String = "Value stepper") {
        self._value = value
        self.range = range
        self.accessibilityLabel = accessibilityLabel
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: theme.mobileLayout.itemGap) {
            DSIconButton(systemImage: "minus", accessibilityLabel: "Decrease") {
                value = max(range.lowerBound, value - 1)
            }
            Text("\(value)").dsFont(.headline).frame(minWidth: 48)
                .accessibilityHidden(true)
            DSIconButton(systemImage: "plus", accessibilityLabel: "Increase") {
                value = min(range.upperBound, value + 1)
            }
        }
        .padding(.horizontal, theme.mobileLayout.gutter)
        .frame(height: DSPenV2Metrics.presetTileHeight)
        .frame(maxWidth: .infinity)
        .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
        .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue("\(value)")
    }
}

// MARK: - Quick action tile

public struct DSQuickActionTile: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String
    public let systemImage: String
    public let action: () -> Void

    public init(title: String, systemImage: String, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.action = action
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: systemImage).font(.system(size: DSComponentMetrics.standardIcon, weight: .medium))
                    .foregroundStyle(Color(dsHex: c.primary))
                Text(title).dsFont(.caption).foregroundStyle(Color(dsHex: c.inkBody))
            }
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: DSPenV2Metrics.quickActionRadius))
            .overlay(RoundedRectangle(cornerRadius: DSPenV2Metrics.quickActionRadius).stroke(Color(dsHex: c.border), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .frame(minHeight: theme.mobileLayout.touchTarget)
        .accessibilityLabel(title)
    }
}

// MARK: - Activity row

public struct DSActivityRow: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String
    public let detail: String?
    public let timestamp: String
    public let systemImage: String
    public let actionTitle: String?
    public let onAction: (() -> Void)?

    public init(
        title: String,
        detail: String? = nil,
        timestamp: String,
        systemImage: String,
        actionTitle: String? = nil,
        onAction: (() -> Void)? = nil
    ) {
        self.title = title
        self.detail = detail
        self.timestamp = timestamp
        self.systemImage = systemImage
        self.actionTitle = actionTitle
        self.onAction = onAction
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: DSComponentMetrics.standardIcon))
                .foregroundStyle(Color(dsHex: c.primary))
                .frame(width: 36, height: 36)
                .background(Color(dsHex: c.successLight), in: Circle())
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).dsFont(.body).fontWeight(.semibold).foregroundStyle(Color(dsHex: c.foreground))
                if let detail {
                    Text(detail).dsFont(.caption).foregroundStyle(Color(dsHex: c.inkMuted))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(alignment: .trailing, spacing: 4) {
                Text(timestamp).dsFont(.caption).foregroundStyle(Color(dsHex: c.inkMuted))
                if let actionTitle, let onAction {
                    Button(actionTitle, action: onAction)
                        .buttonStyle(.plain)
                        .dsFont(.caption).fontWeight(.semibold)
                        .foregroundStyle(Color(dsHex: c.primary))
                        .frame(minWidth: 44, minHeight: 44)
                        .accessibilityLabel(actionTitle)
                }
            }
        }
        .padding(.horizontal, theme.mobileLayout.gutter)
        .frame(minHeight: 52)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(title), \(timestamp)")
    }
}

// MARK: - Multiline field

public struct DSMultilineField: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let label: String
    @Binding public var text: String
    public let maxLength: Int
    public let accessibilityLabel: String

    public init(label: String, text: Binding<String>, maxLength: Int = 500, accessibilityLabel: String? = nil) {
        self.label = label
        self._text = text
        self.maxLength = maxLength
        self.accessibilityLabel = accessibilityLabel ?? label
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(alignment: .leading, spacing: theme.mobileLayout.itemGap / 2) {
            Text(label).dsFont(.label).foregroundStyle(Color(dsHex: c.inkBody))
            TextEditor(text: Binding(
                get: { text },
                set: { text = String($0.prefix(maxLength)) }
            ))
            .dsFont(.body)
            .foregroundStyle(Color(dsHex: c.foreground))
            .frame(minHeight: theme.mobileLayout.fieldHeight * 2)
            .padding(.horizontal, DSTokens.Spacing.s3)
            .padding(.vertical, DSTokens.Spacing.s2)
            .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.radius.control))
            .overlay(RoundedRectangle(cornerRadius: theme.radius.control).stroke(Color(dsHex: c.border), lineWidth: 1))
            .accessibilityLabel(accessibilityLabel)
            Text("\(text.count)/\(maxLength)").dsFont(.caption).foregroundStyle(Color(dsHex: c.inkMuted))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .accessibilityLabel("\(text.count) of \(maxLength) characters")
        }
    }
}
#endif

#if canImport(SwiftUI)
import SwiftUI

public enum AbeButtonVariant: Sendable, Equatable { case primary, secondary, ghost, destructive }
public enum AbeChipTone: Sendable { case neutral, accent, success, warning, error }
public enum AbeStatTone: Sendable, Equatable { case neutral, success, warning, error }

/// Fixed visual sizes called out by the Pen spec that have no corresponding token roles.
public enum AbeComponentMetrics {
    public static let smallIcon: CGFloat = 18
    public static let standardIcon: CGFloat = 20
    public static let tabIcon: CGFloat = 22
    public static let avatar: CGFloat = 40
    public static let chipHorizontalPadding: CGFloat = 10
    public static let chipVerticalPadding: CGFloat = 4
    public static let sheetHandleWidth: CGFloat = 40
    public static let sheetHandleHeight: CGFloat = 5
}

/// A text button with primary, secondary, ghost, and destructive appearances.
public struct AbeButton: View {
    public let title: String
    public let variant: AbeButtonVariant
    public let leadingSystemImage: String?
    public let accessibilityLabel: String?
    public let action: () -> Void

    public init(_ title: String, variant: AbeButtonVariant = .primary, leadingSystemImage: String? = nil, accessibilityLabel: String? = nil, action: @escaping () -> Void) {
        self.title = title; self.variant = variant; self.leadingSystemImage = leadingSystemImage
        self.accessibilityLabel = accessibilityLabel; self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: AbeTokens.Spacing.s2) {
                if let leadingSystemImage { Image(systemName: leadingSystemImage).accessibilityHidden(true) }
                Text(title).abeFont(.body).fontWeight(.semibold)
            }
            .frame(maxWidth: variant == .ghost ? nil : .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(AbeButtonStyle(variant: variant))
        .accessibilityLabel(accessibilityLabel ?? title)
    }
}

/// Circular icon action with an explicit VoiceOver label.
public struct AbeIconButton: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let systemImage: String
    public let accessibilityLabel: String
    public let action: () -> Void

    public init(systemImage: String, accessibilityLabel: String, action: @escaping () -> Void) {
        self.systemImage = systemImage; self.accessibilityLabel = accessibilityLabel; self.action = action
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        Button(action: action) {
            Image(systemName: systemImage).font(.system(size: AbeComponentMetrics.standardIcon, weight: .medium))
                .foregroundStyle(Color(abeHex: c.foreground)).frame(width: 44, height: 44)
                .background(Color(abeHex: c.card), in: Circle())
                .overlay(Circle().stroke(Color(abeHex: c.border), lineWidth: 1))
                .contentShape(Circle())
        }
        .buttonStyle(.plain).frame(minWidth: theme.mobileLayout.touchTarget, minHeight: theme.mobileLayout.touchTarget)
        .accessibilityLabel(accessibilityLabel).accessibilityAddTraits(.isButton)
    }
}

public struct AbeChip: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String
    public let tone: AbeChipTone
    public init(_ title: String, tone: AbeChipTone = .neutral) { self.title = title; self.tone = tone }
    public var body: some View {
        let c = theme.colors(for: scheme)
        let (foreground, background) = palette(tone, colors: c)
        Text(title).abeFont(.caption).fontWeight(.semibold).foregroundStyle(Color(abeHex: foreground))
            .padding(.horizontal, AbeComponentMetrics.chipHorizontalPadding).padding(.vertical, AbeComponentMetrics.chipVerticalPadding)
            .background(background, in: Capsule())
            .accessibilityLabel("Status: \(title)")
    }

    private func palette(_ tone: AbeChipTone, colors c: AbeColorScheme) -> (UInt32, Color) {
        switch tone {
        case .neutral: (c.secondaryForeground, Color(abeHex: c.secondary))
        case .accent: (c.primary, Color(abeHex: c.primary).opacity(0.10))
        case .success: (c.success, Color(abeHex: c.successLight))
        case .warning: (c.warning, Color(abeHex: c.warningLight))
        case .error: (c.error, Color(abeHex: c.errorLight))
        }
    }
}

public struct AbeAvatar: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let initials: String
    public let accessibilityLabel: String
    public init(initials: String, accessibilityLabel: String? = nil) { self.initials = initials; self.accessibilityLabel = accessibilityLabel ?? initials }
    public var body: some View {
        let c = theme.colors(for: scheme)
        Text(initials).abeFont(.label).foregroundStyle(Color(abeHex: c.primary))
            .frame(width: AbeComponentMetrics.avatar, height: AbeComponentMetrics.avatar).background(Color(abeHex: c.muted), in: Circle())
            .accessibilityLabel(accessibilityLabel).accessibilityAddTraits(.isImage)
    }
}

public struct AbeListRow<Leading: View, Trailing: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String
    public let subtitle: String?
    public let showsChevron: Bool
    public let accessibilityLabel: String
    public let action: (() -> Void)?
    @ViewBuilder public let leading: Leading
    @ViewBuilder public let trailing: Trailing

    public init(title: String, subtitle: String? = nil, accessibilityLabel: String? = nil, showsChevron: Bool = false, action: (() -> Void)? = nil, @ViewBuilder leading: () -> Leading = { EmptyView() }, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) {
        self.title = title; self.subtitle = subtitle; self.accessibilityLabel = accessibilityLabel ?? title
        self.showsChevron = showsChevron; self.action = action; self.leading = leading(); self.trailing = trailing()
    }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: theme.mobileLayout.itemGap) {
            leading
            VStack(alignment: .leading, spacing: AbeTokens.Spacing.s1 / 2) {
                Text(title).abeFont(.body).fontWeight(.semibold).foregroundStyle(Color(abeHex: c.foreground))
                if let subtitle { Text(subtitle).abeFont(.label).foregroundStyle(Color(abeHex: c.inkMuted)) }
            }.frame(maxWidth: .infinity, alignment: .leading)
            trailing
            if showsChevron { Image(systemName: "chevron.right").font(.system(size: AbeComponentMetrics.smallIcon, weight: .semibold)).foregroundStyle(Color(abeHex: c.inkMuted)).accessibilityHidden(true) }
        }
        .padding(.horizontal, theme.mobileLayout.gutter).padding(.vertical, AbeTokens.Spacing.s3)
        .background(Color(abeHex: c.card))
        .contentShape(Rectangle())
        .ifLet(action) { view, perform in Button(action: perform) { view }.buttonStyle(.plain).accessibilityLabel(accessibilityLabel) }
    }
}

public struct AbeStatTile: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let label: String; public let value: String; public let meta: String?; public let tone: AbeStatTone
    public init(label: String, value: String, meta: String? = nil, tone: AbeStatTone = .neutral) { self.label = label; self.value = value; self.meta = meta; self.tone = tone }
    public var body: some View {
        let c = theme.colors(for: scheme)
        let color: UInt32 = tone == .success ? c.success : tone == .warning ? c.warning : tone == .error ? c.error : c.inkMuted
        VStack(alignment: .leading, spacing: AbeTokens.Spacing.s1) {
            Text(label).abeFont(.label).foregroundStyle(Color(abeHex: c.inkMuted))
            Text(value).abeFont(.headline).foregroundStyle(Color(abeHex: c.foreground))
            if let meta { Text(meta).abeFont(.caption).foregroundStyle(Color(abeHex: color)).accessibilityLabel("\(tone.accessibilityName): \(meta)") }
        }.frame(maxWidth: .infinity, alignment: .leading).padding(AbeTokens.Spacing.s4)
            .background(Color(abeHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
            .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(abeHex: c.border), lineWidth: 1))
    }
}

private extension AbeStatTone { var accessibilityName: String { switch self { case .neutral: "Info"; case .success: "Success"; case .warning: "Warning"; case .error: "Error" } } }

public struct AbeSegmentedControl<Option: Hashable>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let options: [Option]; @Binding public var selection: Option
    public let title: (Option) -> String
    public init(options: [Option], selection: Binding<Option>, title: @escaping (Option) -> String) { self.options = options; self._selection = selection; self.title = title }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 0) {
            ForEach(options, id: \.self) { option in
                let selected = option == selection
                Button { selection = option } label: {
                    Text(title(option)).abeFont(.label).fontWeight(selected ? .semibold : .medium)
                        .foregroundStyle(Color(abeHex: selected ? c.foreground : c.secondaryForeground))
                        .frame(maxWidth: .infinity, minHeight: theme.mobileLayout.touchTarget).background {
                            if selected { Capsule().fill(Color(abeHex: c.card)).shadow(color: Color(abeHex: c.foreground).opacity(0.08), radius: 3, y: 1) }
                        }
                }.buttonStyle(.plain).accessibilityAddTraits(selected ? .isSelected : [])
                    .accessibilityLabel(title(option))
            }
        }.padding(4).background(Color(abeHex: c.secondary), in: Capsule()).accessibilityElement(children: .contain)
    }
}

public struct AbeField<Content: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let label: String; public let accessibilityLabel: String
    @ViewBuilder public let content: Content
    public init(label: String, accessibilityLabel: String? = nil, @ViewBuilder content: () -> Content) { self.label = label; self.accessibilityLabel = accessibilityLabel ?? label; self.content = content() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(alignment: .leading, spacing: theme.mobileLayout.itemGap / 2) {
            Text(label).abeFont(.label).foregroundStyle(Color(abeHex: c.inkBody))
            content.abeFont(.body).foregroundStyle(Color(abeHex: c.foreground))
                .padding(.horizontal, AbeTokens.Spacing.s4).frame(maxWidth: .infinity, minHeight: theme.mobileLayout.fieldHeight, alignment: .leading)
                .background(Color(abeHex: c.card), in: RoundedRectangle(cornerRadius: theme.radius.control))
                .overlay(RoundedRectangle(cornerRadius: theme.radius.control).stroke(Color(abeHex: c.border), lineWidth: 1))
                .accessibilityLabel(accessibilityLabel)
        }
    }
}

public struct AbeSearchField: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @Binding public var text: String
    public let placeholder: String
    public init(text: Binding<String>, placeholder: String = "Search", accessibilityLabel: String = "Search") { self._text = text; self.placeholder = placeholder; self.accessibilityLabel = accessibilityLabel }
    public let accessibilityLabel: String
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: AbeTokens.Spacing.s2) {
            Image(systemName: "magnifyingglass").font(.system(size: AbeComponentMetrics.smallIcon)).foregroundStyle(Color(abeHex: c.inkMuted)).accessibilityHidden(true)
            TextField(placeholder, text: $text).abeFont(.body).accessibilityLabel(accessibilityLabel)
        }.padding(.horizontal, theme.mobileLayout.gutter * 0.7).frame(minHeight: theme.mobileLayout.touchTarget).background(Color(abeHex: c.secondary), in: Capsule())
    }
}

public struct AbeLargeTitle<Trailing: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let eyebrow: String?; public let title: String
    @ViewBuilder public let trailing: Trailing
    public init(eyebrow: String? = nil, title: String, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) { self.eyebrow = eyebrow; self.title = title; self.trailing = trailing() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(alignment: .leading, spacing: AbeTokens.Spacing.s1) {
            if let eyebrow { Text(eyebrow).abeFont(.label).foregroundStyle(Color(abeHex: c.inkMuted)) }
            HStack { Text(title).abeFont(.title).frame(maxWidth: .infinity, alignment: .leading); trailing }
        }.padding(.horizontal, theme.mobileLayout.gutter).padding(.top, AbeTokens.Spacing.s2).padding(.bottom, AbeTokens.Spacing.s1)
    }
}

public struct AbeNavBar<Leading: View, Trailing: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String; @ViewBuilder public let leading: Leading; @ViewBuilder public let trailing: Trailing
    public init(title: String, @ViewBuilder leading: () -> Leading = { EmptyView() }, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) { self.title = title; self.leading = leading(); self.trailing = trailing() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack { leading.frame(minWidth: theme.mobileLayout.touchTarget, alignment: .leading); Spacer(minLength: 0); Text(title).abeFont(.label).fontWeight(.semibold).foregroundStyle(Color(abeHex: c.foreground)); Spacer(minLength: 0); trailing.frame(minWidth: theme.mobileLayout.touchTarget, alignment: .trailing) }
            .padding(.horizontal, theme.mobileLayout.gutter * 0.75).frame(minHeight: theme.mobileLayout.controlHeight)
    }
}

public struct AbeSheetHandle: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public init() {}
    public var body: some View { Capsule().fill(Color(abeHex: theme.colors(for: scheme).border)).frame(width: AbeComponentMetrics.sheetHandleWidth, height: AbeComponentMetrics.sheetHandleHeight).frame(maxWidth: .infinity, minHeight: theme.mobileLayout.touchTarget * 0.42).accessibilityHidden(true) }
}

public struct AbeSectionHeader<Action: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String; @ViewBuilder public let action: Action
    public init(_ title: String, @ViewBuilder action: () -> Action = { EmptyView() }) { self.title = title; self.action = action() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(alignment: .lastTextBaseline) { Text(title).abeFont(.headline).foregroundStyle(Color(abeHex: c.foreground)).frame(maxWidth: .infinity, alignment: .leading); action }
            .padding(.horizontal, theme.mobileLayout.gutter)
    }
}

public struct AbeTabItem: Identifiable, Hashable, Sendable {
    public let id: String; public let title: String; public let systemImage: String
    public init(_ title: String, systemImage: String, id: String? = nil) { self.title = title; self.systemImage = systemImage; self.id = id ?? title }
}

/// A themed status bar sample for the component gallery and app previews.
public struct AbeStatusBar: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let time: String
    public let accessibilityLabel: String

    public init(time: String = "9:41", accessibilityLabel: String = "Status bar") {
        self.time = time
        self.accessibilityLabel = accessibilityLabel
    }

    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack {
            Text(time).abeFont(.label).fontWeight(.semibold)
            Spacer()
            HStack(spacing: theme.mobileLayout.itemGap / 2) {
                Image(systemName: "cellularbars")
                Image(systemName: "wifi")
                Image(systemName: "battery.100percent")
            }.font(.system(size: AbeComponentMetrics.smallIcon, weight: .medium)).accessibilityHidden(true)
        }
        .foregroundStyle(Color(abeHex: c.foreground))
        .padding(.horizontal, theme.mobileLayout.gutter + AbeTokens.Spacing.s2)
        .frame(minHeight: theme.mobileLayout.controlHeight + AbeTokens.Spacing.s1)
        .accessibilityElement(children: .ignore).accessibilityLabel("\(accessibilityLabel), \(time)")
    }
}

public struct AbeTabBar: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let items: [AbeTabItem]; @Binding public var selection: String
    public let accessibilityLabel: String
    public init(items: [AbeTabItem], selection: Binding<String>, accessibilityLabel: String = "Tab bar") { self.items = items; self._selection = selection; self.accessibilityLabel = accessibilityLabel }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 0) {
            ForEach(items) { item in
                let active = selection == item.id
                Button { selection = item.id } label: {
                    VStack(spacing: 3) {
                        Image(systemName: item.systemImage).font(.system(size: AbeComponentMetrics.tabIcon)).accessibilityHidden(true)
                        Text(item.title).abeFont(.caption).fontWeight(active ? .semibold : .medium)
                    }.foregroundStyle(Color(abeHex: active ? c.primary : c.inkMuted))
                        .frame(maxWidth: .infinity, minHeight: theme.mobileLayout.touchTarget).padding(.vertical, theme.mobileLayout.itemGap / 2)
                        .background { if active { Capsule().fill(Color(abeHex: c.primary).opacity(0.10)) } }
                }.buttonStyle(.plain).accessibilityLabel(item.title).accessibilityAddTraits(active ? .isSelected : [])
            }
        }.padding(6).background(Color(abeHex: c.card).opacity(0.9), in: Capsule())
            .overlay(Capsule().stroke(Color(abeHex: c.border), lineWidth: 1))
            .shadow(color: Color(abeHex: c.foreground).opacity(0.08), radius: 12, y: 4)
            .accessibilityElement(children: .contain).accessibilityLabel(accessibilityLabel)
    }
}

public struct AbeCard<Content: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @ViewBuilder public let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        content.padding(theme.mobileLayout.gutter).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(abeHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
            .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(abeHex: c.border), lineWidth: 1))
    }
}

public struct AbeEmptyState<Action: View>: View {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let systemImage: String; public let title: String; public let message: String
    @ViewBuilder public let action: Action
    public init(systemImage: String, title: String, message: String, @ViewBuilder action: () -> Action = { EmptyView() }) { self.systemImage = systemImage; self.title = title; self.message = message; self.action = action() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(spacing: theme.mobileLayout.itemGap) {
            Image(systemName: systemImage).font(.system(size: 28)).foregroundStyle(Color(abeHex: c.primary)).accessibilityHidden(true)
            Text(title).abeFont(.headline).foregroundStyle(Color(abeHex: c.foreground))
            Text(message).abeFont(.body).foregroundStyle(Color(abeHex: c.inkBody)).multilineTextAlignment(.center)
            action
        }.padding(theme.mobileLayout.gutter).frame(maxWidth: .infinity).accessibilityElement(children: .contain)
    }
}

private extension View {
    @ViewBuilder func ifLet<Value, Result: View>(_ value: Value?, transform: (Self, Value) -> Result) -> some View {
        if let value { transform(self, value) } else { self }
    }
}
#endif

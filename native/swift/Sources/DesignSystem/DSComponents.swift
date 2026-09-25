#if canImport(SwiftUI)
import SwiftUI

public enum DSButtonVariant: Sendable, Equatable { case primary, secondary, ghost, destructive }
public enum DSChipTone: Sendable { case neutral, accent, success, warning, error }
public enum DSStatTone: Sendable, Equatable { case neutral, success, warning, error }

/// Fixed visual sizes with no corresponding token role (shared + pattern components).
public enum DSComponentMetrics {
    public static let smallIcon: CGFloat = 18
    public static let standardIcon: CGFloat = 20
    public static let tabIcon: CGFloat = 22
    public static let avatar: CGFloat = 40
    public static let chipHorizontalPadding: CGFloat = 10
    public static let chipVerticalPadding: CGFloat = 4
    public static let sheetHandleWidth: CGFloat = 40
    public static let sheetHandleHeight: CGFloat = 5
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

/// A text button with primary, secondary, ghost, and destructive appearances.
public struct DSButton: View {
    public let title: String
    public let variant: DSButtonVariant
    public let leadingSystemImage: String?
    public let accessibilityLabel: String?
    public let action: () -> Void

    public init(_ title: String, variant: DSButtonVariant = .primary, leadingSystemImage: String? = nil, accessibilityLabel: String? = nil, action: @escaping () -> Void) {
        self.title = title; self.variant = variant; self.leadingSystemImage = leadingSystemImage
        self.accessibilityLabel = accessibilityLabel; self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: DSTokens.Spacing.s2) {
                if let leadingSystemImage { Image(systemName: leadingSystemImage).accessibilityHidden(true) }
                Text(title).dsFont(.body).fontWeight(.semibold)
            }
            .frame(maxWidth: variant == .ghost ? nil : .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(DSButtonStyle(variant: variant))
        .accessibilityLabel(accessibilityLabel ?? title)
    }
}

/// Circular icon action with an explicit VoiceOver label.
public struct DSIconButton: View {
    @Environment(\.dsTheme) private var theme
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
            Image(systemName: systemImage).font(.system(size: DSComponentMetrics.standardIcon, weight: .medium))
                .foregroundStyle(Color(dsHex: c.foreground)).frame(width: 44, height: 44)
                .background(Color(dsHex: c.card), in: Circle())
                .overlay(Circle().stroke(Color(dsHex: c.border), lineWidth: 1))
                .contentShape(Circle())
        }
        .buttonStyle(.plain).frame(minWidth: theme.mobileLayout.touchTarget, minHeight: theme.mobileLayout.touchTarget)
        .accessibilityLabel(accessibilityLabel).accessibilityAddTraits(.isButton)
    }
}

public struct DSChip: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String
    public let tone: DSChipTone
    public init(_ title: String, tone: DSChipTone = .neutral) { self.title = title; self.tone = tone }
    public var body: some View {
        let c = theme.colors(for: scheme)
        let (foreground, background) = palette(tone, colors: c)
        Text(title).dsFont(.caption).fontWeight(.semibold).foregroundStyle(Color(dsHex: foreground))
            .padding(.horizontal, DSComponentMetrics.chipHorizontalPadding).padding(.vertical, DSComponentMetrics.chipVerticalPadding)
            .background(background, in: Capsule())
            .accessibilityLabel("Status: \(title)")
    }

    private func palette(_ tone: DSChipTone, colors c: DSColorScheme) -> (UInt32, Color) {
        switch tone {
        case .neutral: (c.secondaryForeground, Color(dsHex: c.secondary))
        case .accent: (c.primary, Color(dsHex: c.primary).opacity(0.10))
        case .success: (c.success, Color(dsHex: c.successLight))
        case .warning: (c.warning, Color(dsHex: c.warningLight))
        case .error: (c.error, Color(dsHex: c.errorLight))
        }
    }
}

public struct DSAvatar: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let initials: String
    public let accessibilityLabel: String
    public init(initials: String, accessibilityLabel: String? = nil) { self.initials = initials; self.accessibilityLabel = accessibilityLabel ?? initials }
    public var body: some View {
        let c = theme.colors(for: scheme)
        Text(initials).dsFont(.label).foregroundStyle(Color(dsHex: c.primary))
            .frame(width: DSComponentMetrics.avatar, height: DSComponentMetrics.avatar).background(Color(dsHex: c.muted), in: Circle())
            .accessibilityLabel(accessibilityLabel).accessibilityAddTraits(.isImage)
    }
}

public struct DSListRow<Leading: View, Trailing: View>: View {
    @Environment(\.dsTheme) private var theme
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
            VStack(alignment: .leading, spacing: DSTokens.Spacing.s1 / 2) {
                Text(title).dsFont(.body).fontWeight(.semibold).foregroundStyle(Color(dsHex: c.foreground))
                if let subtitle { Text(subtitle).dsFont(.label).foregroundStyle(Color(dsHex: c.inkMuted)) }
            }.frame(maxWidth: .infinity, alignment: .leading)
            trailing
            if showsChevron { Image(systemName: "chevron.right").font(.system(size: DSComponentMetrics.smallIcon, weight: .semibold)).foregroundStyle(Color(dsHex: c.inkMuted)).accessibilityHidden(true) }
        }
        .padding(.horizontal, theme.mobileLayout.gutter).padding(.vertical, DSTokens.Spacing.s3)
        .background(Color(dsHex: c.card))
        .contentShape(Rectangle())
        .ifLet(action) { view, perform in Button(action: perform) { view }.buttonStyle(.plain).accessibilityLabel(accessibilityLabel) }
    }
}

public struct DSStatTile: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let label: String; public let value: String; public let meta: String?; public let tone: DSStatTone
    public init(label: String, value: String, meta: String? = nil, tone: DSStatTone = .neutral) { self.label = label; self.value = value; self.meta = meta; self.tone = tone }
    public var body: some View {
        let c = theme.colors(for: scheme)
        let color: UInt32 = tone == .success ? c.success : tone == .warning ? c.warning : tone == .error ? c.error : c.inkMuted
        VStack(alignment: .leading, spacing: DSTokens.Spacing.s1) {
            Text(label).dsFont(.label).foregroundStyle(Color(dsHex: c.inkMuted))
            Text(value).dsFont(.headline).foregroundStyle(Color(dsHex: c.foreground))
            if let meta { Text(meta).dsFont(.caption).foregroundStyle(Color(dsHex: color)).accessibilityLabel("\(tone.accessibilityName): \(meta)") }
        }.frame(maxWidth: .infinity, alignment: .leading).padding(DSTokens.Spacing.s4)
            .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
            .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: 1))
    }
}

private extension DSStatTone { var accessibilityName: String { switch self { case .neutral: "Info"; case .success: "Success"; case .warning: "Warning"; case .error: "Error" } } }

public struct DSSegmentedControl<Option: Hashable>: View {
    @Environment(\.dsTheme) private var theme
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
                    Text(title(option)).dsFont(.label).fontWeight(selected ? .semibold : .medium)
                        .foregroundStyle(Color(dsHex: selected ? c.foreground : c.secondaryForeground))
                        .frame(maxWidth: .infinity, minHeight: theme.mobileLayout.touchTarget).background {
                            if selected { Capsule().fill(Color(dsHex: c.card)).shadow(color: Color(dsHex: c.foreground).opacity(0.08), radius: 3, y: 1) }
                        }
                }.buttonStyle(.plain).accessibilityAddTraits(selected ? .isSelected : [])
                    .accessibilityLabel(title(option))
            }
        }.padding(4).background(Color(dsHex: c.secondary), in: Capsule()).accessibilityElement(children: .contain)
    }
}

public struct DSField<Content: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let label: String; public let accessibilityLabel: String
    @ViewBuilder public let content: Content
    public init(label: String, accessibilityLabel: String? = nil, @ViewBuilder content: () -> Content) { self.label = label; self.accessibilityLabel = accessibilityLabel ?? label; self.content = content() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(alignment: .leading, spacing: theme.mobileLayout.itemGap / 2) {
            Text(label).dsFont(.label).foregroundStyle(Color(dsHex: c.inkBody))
            content.dsFont(.body).foregroundStyle(Color(dsHex: c.foreground))
                .padding(.horizontal, DSTokens.Spacing.s4).frame(maxWidth: .infinity, minHeight: theme.mobileLayout.fieldHeight, alignment: .leading)
                .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.radius.control))
                .overlay(RoundedRectangle(cornerRadius: theme.radius.control).stroke(Color(dsHex: c.border), lineWidth: 1))
                .accessibilityLabel(accessibilityLabel)
        }
    }
}

public struct DSSearchField: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @Binding public var text: String
    public let placeholder: String
    public init(text: Binding<String>, placeholder: String = "Search", accessibilityLabel: String = "Search") { self._text = text; self.placeholder = placeholder; self.accessibilityLabel = accessibilityLabel }
    public let accessibilityLabel: String
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: DSTokens.Spacing.s2) {
            Image(systemName: "magnifyingglass").font(.system(size: DSComponentMetrics.smallIcon)).foregroundStyle(Color(dsHex: c.inkMuted)).accessibilityHidden(true)
            TextField(placeholder, text: $text).dsFont(.body).accessibilityLabel(accessibilityLabel)
        }.padding(.horizontal, theme.mobileLayout.gutter * 0.7).frame(minHeight: theme.mobileLayout.touchTarget).background(Color(dsHex: c.secondary), in: Capsule())
    }
}

public struct DSLargeTitle<Trailing: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let eyebrow: String?; public let title: String
    @ViewBuilder public let trailing: Trailing
    public init(eyebrow: String? = nil, title: String, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) { self.eyebrow = eyebrow; self.title = title; self.trailing = trailing() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(alignment: .leading, spacing: DSTokens.Spacing.s1) {
            if let eyebrow { Text(eyebrow).dsFont(.label).foregroundStyle(Color(dsHex: c.inkMuted)) }
            HStack { Text(title).dsFont(.title).frame(maxWidth: .infinity, alignment: .leading); trailing }
        }.padding(.horizontal, theme.mobileLayout.gutter).padding(.top, DSTokens.Spacing.s2).padding(.bottom, DSTokens.Spacing.s1)
    }
}

public struct DSNavBar<Leading: View, Trailing: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String; @ViewBuilder public let leading: Leading; @ViewBuilder public let trailing: Trailing
    public init(title: String, @ViewBuilder leading: () -> Leading = { EmptyView() }, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) { self.title = title; self.leading = leading(); self.trailing = trailing() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack { leading.frame(minWidth: theme.mobileLayout.touchTarget, alignment: .leading); Spacer(minLength: 0); Text(title).dsFont(.label).fontWeight(.semibold).foregroundStyle(Color(dsHex: c.foreground)); Spacer(minLength: 0); trailing.frame(minWidth: theme.mobileLayout.touchTarget, alignment: .trailing) }
            .padding(.horizontal, theme.mobileLayout.gutter * 0.75).frame(minHeight: theme.mobileLayout.controlHeight)
    }
}

public struct DSSheetHandle: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public init() {}
    public var body: some View { Capsule().fill(Color(dsHex: theme.colors(for: scheme).border)).frame(width: DSComponentMetrics.sheetHandleWidth, height: DSComponentMetrics.sheetHandleHeight).frame(maxWidth: .infinity, minHeight: theme.mobileLayout.touchTarget * 0.42).accessibilityHidden(true) }
}

public struct DSSectionHeader<Action: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let title: String; @ViewBuilder public let action: Action
    public init(_ title: String, @ViewBuilder action: () -> Action = { EmptyView() }) { self.title = title; self.action = action() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(alignment: .bottom) { Text(title).font(DSFontResolver.font(family: theme.mobileType.body.family, size: 17, heading: false).weight(.semibold)).foregroundStyle(Color(dsHex: c.foreground)).frame(maxWidth: .infinity, alignment: .leading); action }
    }
}

public struct DSTabItem: Identifiable, Hashable, Sendable {
    public let id: String; public let title: String; public let systemImage: String
    public init(_ title: String, systemImage: String, id: String? = nil) { self.title = title; self.systemImage = systemImage; self.id = id ?? title }
}

/// A themed status bar sample for the component gallery and app previews.
public struct DSStatusBar: View {
    @Environment(\.dsTheme) private var theme
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
            Text(time).dsFont(.label).fontWeight(.semibold)
            Spacer()
            HStack(spacing: theme.mobileLayout.itemGap / 2) {
                Image(systemName: "cellularbars")
                Image(systemName: "wifi")
                Image(systemName: "battery.100percent")
            }.font(.system(size: DSComponentMetrics.smallIcon, weight: .medium)).accessibilityHidden(true)
        }
        .foregroundStyle(Color(dsHex: c.foreground))
        .padding(.horizontal, theme.mobileLayout.gutter + DSTokens.Spacing.s2)
        .frame(minHeight: theme.mobileLayout.controlHeight + DSTokens.Spacing.s1)
        .accessibilityElement(children: .ignore).accessibilityLabel("\(accessibilityLabel), \(time)")
    }
}

public struct DSTabBar: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let items: [DSTabItem]; @Binding public var selection: String
    public let accessibilityLabel: String
    public init(items: [DSTabItem], selection: Binding<String>, accessibilityLabel: String = "Tab bar") { self.items = items; self._selection = selection; self.accessibilityLabel = accessibilityLabel }
    public var body: some View {
        let c = theme.colors(for: scheme)
        HStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                let active = selection == item.id
                if index > 0 { Spacer(minLength: 0) }
                Button { selection = item.id } label: {
                    VStack(spacing: 3) {
                        Image(systemName: item.systemImage).font(.system(size: DSComponentMetrics.tabIcon)).frame(width: 22, height: 22).accessibilityHidden(true)
                        Text(item.title).font(DSFontResolver.font(family: theme.mobileType.body.family, size: 10.5, heading: false).weight(active ? .semibold : .medium)).lineLimit(1).minimumScaleFactor(0.8)
                    }.foregroundStyle(Color(dsHex: active ? c.primary : c.inkMuted))
                        .padding(.vertical, 6).padding(.horizontal, 14)
                        .background { if active { Capsule().fill(Color(dsHex: c.primary).opacity(0.10)) } }
                }.buttonStyle(.plain).accessibilityLabel(item.title).accessibilityAddTraits(active ? .isSelected : [])
            }
        }.frame(maxWidth: .infinity).padding(6).frame(minHeight: 64).background(Color(dsHex: c.card).opacity(0.9), in: Capsule())
            .overlay(Capsule().stroke(Color(dsHex: c.border), lineWidth: 1))
            .shadow(color: Color(dsHex: c.foreground).opacity(0.08), radius: 24, y: 8)
            .padding(.horizontal, 16).padding(.bottom, 12)
            .accessibilityElement(children: .contain).accessibilityLabel(accessibilityLabel)
    }
}

public struct DSCard<Content: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @ViewBuilder public let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        content.padding(theme.mobileLayout.gutter).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(dsHex: c.card), in: RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius))
            .overlay(RoundedRectangle(cornerRadius: theme.mobileLayout.cardRadius).stroke(Color(dsHex: c.border), lineWidth: 1))
    }
}

public struct DSEmptyState<Action: View>: View {
    @Environment(\.dsTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    public let systemImage: String; public let title: String; public let message: String
    @ViewBuilder public let action: Action
    public init(systemImage: String, title: String, message: String, @ViewBuilder action: () -> Action = { EmptyView() }) { self.systemImage = systemImage; self.title = title; self.message = message; self.action = action() }
    public var body: some View {
        let c = theme.colors(for: scheme)
        VStack(spacing: theme.mobileLayout.itemGap) {
            Image(systemName: systemImage).font(.system(size: 28)).foregroundStyle(Color(dsHex: c.primary)).accessibilityHidden(true)
            Text(title).dsFont(.headline).foregroundStyle(Color(dsHex: c.foreground))
            Text(message).dsFont(.body).foregroundStyle(Color(dsHex: c.inkBody)).multilineTextAlignment(.center)
            action
        }.padding(theme.mobileLayout.gutter).frame(maxWidth: .infinity).accessibilityElement(children: .contain)
    }
}

public enum DSProgressTone { case accent, accent2 }
public enum DSNudgeTone { case warn, alert }
public struct DSToggle: View {
 @Environment(\.dsTheme) private var theme; @Environment(\.colorScheme) private var scheme
 @Binding public var isOn: Bool; public var disabled: Bool; public var accessibilityLabel: String
 public init(isOn: Binding<Bool>, disabled: Bool = false, accessibilityLabel: String = "Toggle") { self._isOn=isOn; self.disabled=disabled; self.accessibilityLabel=accessibilityLabel }
 public var body: some View { let c=theme.colors(for: scheme); Button { isOn.toggle() } label: { Capsule().fill(Color(dsHex:isOn ? c.accent2 : c.border)).frame(width:38,height:22).overlay(alignment:isOn ? .trailing : .leading) { Circle().fill(Color(dsHex:c.surfaceCard)).frame(width:16,height:16).padding(3) }.frame(width:48,height:48).contentShape(Rectangle()) }.buttonStyle(.plain).disabled(disabled).accessibilityLabel(accessibilityLabel).accessibilityValue(isOn ? "On" : "Off").accessibilityAddTraits(.isButton).accessibilityHint("Switch").accessibilityAction { isOn.toggle() } }
}
public struct DSProgress: View {
 @Environment(\.dsTheme) private var theme; @Environment(\.colorScheme) private var scheme
 public let value: Double; public let label: String?; public let valueLabel: String?; public let tone: DSProgressTone
 public init(value: Double, label: String? = nil, valueLabel: String? = nil, tone: DSProgressTone = .accent) { self.value=value;self.label=label;self.valueLabel=valueLabel;self.tone=tone }
 public var body: some View { let c=theme.colors(for:scheme); let progress=min(1,max(0,value.isFinite ? value : 0)); VStack(spacing:6) { if label != nil || valueLabel != nil { HStack(spacing:6) { Text(label ?? "").dsFont(.label).foregroundStyle(Color(dsHex:c.inkBody)); Spacer(minLength:0); Text(valueLabel ?? "").dsFont(.label).fontWeight(.semibold).foregroundStyle(Color(dsHex:c.ink)) } }; GeometryReader { g in ZStack(alignment:.leading) { Capsule().fill(Color(dsHex:c.surfaceSand)); Capsule().fill(Color(dsHex:tone == .accent ? c.primary : c.accent2)).frame(width:g.size.width*progress) } }.frame(height:6) }.accessibilityElement(children:.ignore).accessibilityLabel(label ?? "Progress").accessibilityValue(valueLabel ?? "\(Int(progress*100)) percent") }
}
public struct DSInkCard<Content: View>: View {
 @Environment(\.dsTheme) private var theme; @Environment(\.colorScheme) private var scheme
 @ViewBuilder public let content: Content
 public init(@ViewBuilder content:()->Content) { self.content=content() }
 public var body: some View { let c=theme.colors(for:scheme); content.foregroundStyle(Color(dsHex:c.onInk)).padding(20).frame(maxWidth:.infinity,alignment:.leading).background(Color(dsHex:c.ink900),in:RoundedRectangle(cornerRadius:20)) }
}
public struct DSNudge: View {
 @Environment(\.dsTheme) private var theme; @Environment(\.colorScheme) private var scheme
 public let title:String; public let subtitle:String; public let systemImage:String; public let tone:DSNudgeTone; public let action:()->Void
 public init(title:String,subtitle:String,systemImage:String,tone:DSNudgeTone = .warn,action:@escaping()->Void) { self.title=title;self.subtitle=subtitle;self.systemImage=systemImage;self.tone=tone;self.action=action }
 public var body: some View { let c=theme.colors(for:scheme); Button(action:action) { HStack(spacing:14) { Image(systemName:systemImage).foregroundStyle(Color(dsHex:c.warning)); VStack(alignment:.leading,spacing:2) { Text(title).dsFont(.body).fontWeight(.semibold).foregroundStyle(Color(dsHex:c.ink)); Text(subtitle).dsFont(.label).foregroundStyle(Color(dsHex:c.inkBody)) }.frame(maxWidth:.infinity,alignment:.leading); Image(systemName:"chevron.right").foregroundStyle(Color(dsHex:c.warning)) }.padding(16).frame(minHeight:theme.mobileLayout.touchTarget).background(Color(dsHex:tone == .warn ? c.warnBg : c.alertBg),in:RoundedRectangle(cornerRadius:16)) }.buttonStyle(.plain) }
}

private extension View {
    @ViewBuilder func ifLet<Value, Result: View>(_ value: Value?, transform: (Self, Value) -> Result) -> some View {
        if let value { transform(self, value) } else { self }
    }
}
#endif

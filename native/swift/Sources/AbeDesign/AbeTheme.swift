#if canImport(SwiftUI)
import SwiftUI

public extension Color {
    /// 0xRRGGBB, as emitted in AbeTokens.
    init(abeHex hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

private struct AbeThemeKey: EnvironmentKey {
    static let defaultValue: AbeThemeTokens = AbeTokens.bible
}

public extension EnvironmentValues {
    var abeTheme: AbeThemeTokens {
        get { self[AbeThemeKey.self] }
        set { self[AbeThemeKey.self] = newValue }
    }
}

public extension View {
    /// Set once at the app root: `.abeTheme(AbeTokens.church)`.
    func abeTheme(_ theme: AbeThemeTokens) -> some View { environment(\.abeTheme, theme) }
}

public extension AbeThemeTokens {
    func colors(for scheme: SwiftUI.ColorScheme) -> AbeColorScheme { colors(dark: scheme == .dark) }

    /// Custom font from the theme; falls back to the system font if the family is not bundled.
    func font(_ family: KeyPath<AbeFontFamilies, String>, size: KeyPath<AbeFontSizes, Double>, weight: Font.Weight = .regular) -> Font {
        .custom(fontFamily[keyPath: family], size: fontSize[keyPath: size]).weight(weight)
    }
}

/// Primary action button styled entirely from the active theme.
public struct AbeButtonStyle: ButtonStyle {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme

    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        let c = theme.colors(for: scheme)
        let label = configuration.label
            .font(.custom(theme.fontFamily.label, size: theme.label.size).weight(Self.weight(theme.label.weight)))
            .tracking(theme.label.tracking)
        return Group {
            if theme.label.uppercase { label.textCase(.uppercase) } else { label.textCase(nil) }
        }
        .foregroundStyle(Color(abeHex: c.actionForeground))
        .padding(.horizontal, AbeTokens.Spacing.s5)
        .frame(minHeight: AbeTokens.minTouchTarget)
        .background(Color(abeHex: c.action), in: RoundedRectangle(cornerRadius: min(theme.radius.button, AbeTokens.minTouchTarget / 2)))
        .opacity(configuration.isPressed ? 0.85 : 1)
    }

    static func weight(_ w: Int) -> Font.Weight {
        switch w {
        case ..<450: .regular
        case ..<550: .medium
        case ..<650: .semibold
        case ..<750: .bold
        case ..<850: .heavy
        default: .black
        }
    }
}
#endif

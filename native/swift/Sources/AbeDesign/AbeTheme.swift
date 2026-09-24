#if canImport(SwiftUI)
import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

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
    /// Resolves the palette against the requested appearance while honoring light-only themes.
    func colors(for scheme: SwiftUI.ColorScheme) -> AbeColorScheme {
        colors(dark: supportsDark && scheme == .dark)
    }

    /// Custom font from the theme; falls back to serif for heading families and system sans otherwise.
    func font(_ family: KeyPath<AbeFontFamilies, String>, size: KeyPath<AbeFontSizes, Double>, weight: Font.Weight = .regular) -> Font {
        AbeFontResolver.font(family: fontFamily[keyPath: family], size: fontSize[keyPath: size], heading: family == \.heading).weight(weight)
    }
}

/// Font lookup is exposed for apps that want to diagnose which theme fonts are installed.
public enum AbeFontFallback: Sendable, Equatable { case serif, system }

public enum AbeFontResolver {
    public static func fallback(forHeading heading: Bool) -> AbeFontFallback { heading ? .serif : .system }

    public static func isAvailable(_ family: String) -> Bool {
        #if canImport(UIKit)
        return UIFont(name: family, size: 12) != nil
        #elseif canImport(AppKit)
        return NSFont(name: family, size: 12) != nil
        #else
        return false
        #endif
    }

    public static func font(family: String, size: Double, heading: Bool) -> Font {
        if isAvailable(family) { return .custom(family, size: size) }
        let design: Font.Design = fallback(forHeading: heading) == .serif ? .serif : .default
        return .system(size: size, weight: .regular, design: design)
    }
}

/// Primary action button styled entirely from the active theme.
public struct AbeButtonStyle: ButtonStyle {
    @Environment(\.abeTheme) private var theme
    @Environment(\.colorScheme) private var scheme
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    public let variant: AbeButtonVariant

    public init(variant: AbeButtonVariant = .primary) { self.variant = variant }

    public func makeBody(configuration: Configuration) -> some View {
        let c = theme.colors(for: scheme)
        let fill: Color = variant == .ghost ? .clear : Color(abeHex: variant == .destructive ? c.destructive : variant == .secondary ? c.card : c.action)
        let ink: UInt32 = variant == .destructive ? c.destructiveForeground : variant == .secondary || variant == .ghost ? c.foreground : c.actionForeground
        let label = configuration.label
            .font(AbeFontResolver.font(family: theme.mobileType.label.family, size: theme.mobileType.label.size * Double(scale), heading: false).weight(.semibold))
            .tracking(theme.label.tracking)
        return Group {
            if theme.label.uppercase { label.textCase(.uppercase) } else { label.textCase(nil) }
        }
        .foregroundStyle(Color(abeHex: ink))
        .padding(.horizontal, AbeTokens.Spacing.s5)
        .frame(minHeight: theme.mobileLayout.touchTarget)
        .background(fill, in: RoundedRectangle(cornerRadius: min(theme.radius.button, theme.mobileLayout.touchTarget / 2)))
        .overlay {
            if variant == .secondary { RoundedRectangle(cornerRadius: min(theme.radius.button, theme.mobileLayout.touchTarget / 2)).stroke(Color(abeHex: c.border), lineWidth: 1) }
        }
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

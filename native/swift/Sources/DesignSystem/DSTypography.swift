#if canImport(SwiftUI)
import SwiftUI

public enum DSFontRole: Sendable, Equatable {
    case title, headline, body, label, caption

    var textStyle: Font.TextStyle {
        switch self {
        case .title: .largeTitle
        case .headline: .title2
        case .body: .body
        case .label: .callout
        case .caption: .caption
        }
    }

    var isHeading: Bool { self == .title || self == .headline }

    func token(in theme: DSThemeTokens) -> DSTextRole {
        let role: DSTextRole
        switch self {
        case .title: role = theme.mobileType.title
        case .headline: role = theme.mobileType.headline
        case .body: role = theme.mobileType.body
        case .label: role = theme.mobileType.label
        case .caption: role = theme.mobileType.caption
        }
        return role
    }
}

/// Applies a theme mobile type role and scales with the user's Dynamic Type setting.
private struct DSFontModifier: ViewModifier {
    @Environment(\.dsTheme) private var theme
    @ScaledMetric private var scale: CGFloat
    let role: DSFontRole

    init(role: DSFontRole) {
        self.role = role
        _scale = ScaledMetric(wrappedValue: 1, relativeTo: role.textStyle)
    }

    func body(content: Content) -> some View {
        let token = role.token(in: theme)
        content.font(DSFontResolver.font(family: token.family, size: token.size * Double(scale), heading: role.isHeading).weight(DSButtonStyle.weight(token.weight)))
    }
}

public extension View {
    /// Example: `Text("Welcome").dsFont(.title)`.
    func dsFont(_ role: DSFontRole) -> some View { modifier(DSFontModifier(role: role)) }
}

public struct DSText: View {
    public let value: String
    public let role: DSFontRole

    public init(_ value: String, role: DSFontRole = .body) {
        self.value = value
        self.role = role
    }

    public var body: some View { Text(value).dsFont(role) }
}
#endif

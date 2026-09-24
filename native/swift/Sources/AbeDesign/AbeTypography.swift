#if canImport(SwiftUI)
import SwiftUI

public enum AbeFontRole: Sendable, Equatable {
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

    func token(in theme: AbeThemeTokens) -> AbeTextRole {
        let role: AbeTextRole
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
private struct AbeFontModifier: ViewModifier {
    @Environment(\.abeTheme) private var theme
    @ScaledMetric private var scale: CGFloat
    let role: AbeFontRole

    init(role: AbeFontRole) {
        self.role = role
        _scale = ScaledMetric(wrappedValue: 1, relativeTo: role.textStyle)
    }

    func body(content: Content) -> some View {
        let token = role.token(in: theme)
        content.font(AbeFontResolver.font(family: token.family, size: token.size * Double(scale), heading: role.isHeading).weight(AbeButtonStyle.weight(token.weight)))
    }
}

public extension View {
    /// Example: `Text("Welcome").abeFont(.title)`.
    func abeFont(_ role: AbeFontRole) -> some View { modifier(AbeFontModifier(role: role)) }
}

public struct AbeText: View {
    public let value: String
    public let role: AbeFontRole

    public init(_ value: String, role: AbeFontRole = .body) {
        self.value = value
        self.role = role
    }

    public var body: some View { Text(value).abeFont(role) }
}
#endif

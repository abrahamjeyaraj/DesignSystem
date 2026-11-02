import XCTest
@testable import DesignSystem
#if canImport(SwiftUI)
import SwiftUI
#endif

final class DSTokensTests: XCTestCase {
    func testDefaultThemeValues() {
        XCTAssertEqual(DSTokens.default.light.action, 0x2563EB)
        XCTAssertEqual(DSTokens.default.light.primary, 0x2563EB)
        XCTAssertFalse(DSTokens.default.label.uppercase)
        XCTAssertEqual(DSTokens.default.radius.button, 6)
        XCTAssertEqual(DSTokens.themes.count, 1)
        XCTAssertEqual(DSTokens.defaultTheme, "default")
    }

    #if canImport(SwiftUI)
    func testThemeResolutionUsesDarkPaletteWhenSupported() {
        XCTAssertEqual(DSTokens.default.colors(for: .dark), DSTokens.default.dark)
        XCTAssertEqual(DSTokens.default.colors(for: .light), DSTokens.default.light)
        XCTAssertTrue(DSTokens.default.supportsDark)
    }

    func testFontFallbackUsesSerifForHeadingsAndSystemForOtherRoles() {
        XCTAssertEqual(DSFontResolver.fallback(forHeading: true), .serif)
        XCTAssertEqual(DSFontResolver.fallback(forHeading: false), .system)
        XCTAssertFalse(DSFontResolver.isAvailable("DesignSystem Missing Font"))
    }
    #endif
}

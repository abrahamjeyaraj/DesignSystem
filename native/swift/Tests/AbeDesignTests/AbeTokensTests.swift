import XCTest
@testable import AbeDesign
#if canImport(SwiftUI)
import SwiftUI
#endif

final class AbeTokensTests: XCTestCase {
    func testThemesKeepTheirOwnLook() {
        XCTAssertEqual(AbeTokens.bible.light.action, 0xC8B496)
        XCTAssertEqual(AbeTokens.church.light.primary, 0x1A6B54)
        XCTAssertEqual(AbeTokens.tuition.light.background, 0xFBF7F0)
        XCTAssertTrue(AbeTokens.bible.label.uppercase)
        XCTAssertEqual(AbeTokens.church.radius.card, 15)
        XCTAssertEqual(AbeTokens.themes.count, 3)
    }

    #if canImport(SwiftUI)
    func testThemeResolutionUsesDarkPaletteOnlyWhenSupported() {
        XCTAssertEqual(AbeTokens.church.colors(for: .dark), AbeTokens.church.dark)
        XCTAssertEqual(AbeTokens.bible.colors(for: .light), AbeTokens.bible.light)
        XCTAssertEqual(AbeTokens.tuition.colors(for: .dark), AbeTokens.tuition.light)
        XCTAssertFalse(AbeTokens.tuition.supportsDark)
        XCTAssertTrue(AbeTokens.church.supportsDark)
    }

    func testFontFallbackUsesSerifForHeadingsAndSystemForOtherRoles() {
        XCTAssertEqual(AbeFontResolver.fallback(forHeading: true), .serif)
        XCTAssertEqual(AbeFontResolver.fallback(forHeading: false), .system)
        XCTAssertFalse(AbeFontResolver.isAvailable("AbeDesign Missing Font"))
    }
    #endif
}

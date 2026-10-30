import XCTest
@testable import DesignSystem
#if canImport(SwiftUI)
import SwiftUI
#endif

final class DSTokensTests: XCTestCase {
    func testThemesKeepTheirOwnLook() {
        XCTAssertEqual(DSTokens.bible.light.action, 0xC8B496)
        XCTAssertEqual(DSTokens.church.light.primary, 0x1A6B54)
        XCTAssertEqual(DSTokens.tuition.light.background, 0xFBF7F0)
        XCTAssertTrue(DSTokens.bible.label.uppercase)
        XCTAssertEqual(DSTokens.church.radius.card, 15)
        XCTAssertEqual(DSTokens.church.light.inkBody, 0x625F57)
        XCTAssertEqual(DSTokens.church.light.inkMuted, 0x858179)
        XCTAssertEqual(DSTokens.church.extraLight["gold"], 0xF59E0B)
        XCTAssertEqual(DSTokens.church.extraLight["accent-soft"], 0xD9EBE3)
        XCTAssertEqual(DSTokens.themes.count, 3)
    }

    #if canImport(SwiftUI)
    func testThemeResolutionUsesDarkPaletteOnlyWhenSupported() {
        XCTAssertEqual(DSTokens.church.colors(for: .dark), DSTokens.church.dark)
        XCTAssertEqual(DSTokens.bible.colors(for: .light), DSTokens.bible.light)
        XCTAssertEqual(DSTokens.tuition.colors(for: .dark), DSTokens.tuition.light)
        XCTAssertFalse(DSTokens.tuition.supportsDark)
        XCTAssertTrue(DSTokens.church.supportsDark)
    }

    func testFontFallbackUsesSerifForHeadingsAndSystemForOtherRoles() {
        XCTAssertEqual(DSFontResolver.fallback(forHeading: true), .serif)
        XCTAssertEqual(DSFontResolver.fallback(forHeading: false), .system)
        XCTAssertFalse(DSFontResolver.isAvailable("DesignSystem Missing Font"))
    }
    #endif
}

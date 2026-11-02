import DesignSystem
import XCTest
import SwiftUI

/// AppTheme.swift is what `ds-tokens swift` writes into an app. It must compile against public API only.
final class AppThemeTests: XCTestCase {
    func testBothAppThemeSpellingsShareValues() {
        XCTAssertEqual(DSThemeTokens.compatibilityFixture, DSTokens.compatibilityFixture)
        _ = Text("Preview").dsTheme(.compatibilityFixture)
        _ = Text("Preview").dsTheme(DSTokens.compatibilityFixture)
    }

    func testAppOwnedThemeCarriesFixtureExtras() {
        XCTAssertEqual(DSThemeTokens.sampleApp.extraLight["highlight"], 0x3B82F6)
        XCTAssertNotEqual(DSThemeTokens.sampleApp.light.primary, DSTokens.default.light.primary)
    }
}

import DesignSystem
import XCTest
import SwiftUI

/// AppTheme.swift is what `ds-tokens swift` writes into an app. It must compile against public API only.
final class AppThemeTests: XCTestCase {
    func testBothAppThemeSpellingsShareValues() {
        XCTAssertEqual(DSThemeTokens.compatibilityFixture, DSTokens.compatibilityFixture)
        let _: some View = Text("Preview").dsTheme(.compatibilityFixture)
        let _: some View = Text("Preview").dsTheme(DSTokens.compatibilityFixture)
    }

    func testAppOwnedThemeMatchesBuiltIn() {
        XCTAssertEqual(DSThemeTokens.tuition, DSTokens.tuition)
    }
}

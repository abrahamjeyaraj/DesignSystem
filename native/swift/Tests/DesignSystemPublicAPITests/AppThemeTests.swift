import DesignSystem
import XCTest

/// AppTheme.swift is what `ds-tokens swift` writes into an app. It must compile against public API only.
final class AppThemeTests: XCTestCase {
    func testAppOwnedThemeMatchesBuiltIn() {
        XCTAssertEqual(DSThemeTokens.tuition, DSTokens.tuition)
    }
}

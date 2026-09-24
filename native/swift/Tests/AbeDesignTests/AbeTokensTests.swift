import XCTest
@testable import AbeDesign

final class AbeTokensTests: XCTestCase {
    func testThemesKeepTheirOwnLook() {
        XCTAssertEqual(AbeTokens.bible.light.action, 0xC8B496)
        XCTAssertEqual(AbeTokens.church.light.primary, 0x1A6B54)
        XCTAssertEqual(AbeTokens.tuition.light.background, 0xFBF7F0)
        XCTAssertTrue(AbeTokens.bible.label.uppercase)
        XCTAssertEqual(AbeTokens.church.radius.card, 15)
        XCTAssertEqual(AbeTokens.themes.count, 3)
    }
}

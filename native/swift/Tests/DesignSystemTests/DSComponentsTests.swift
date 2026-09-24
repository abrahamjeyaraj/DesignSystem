import XCTest
@testable import DesignSystem

final class DSComponentsTests: XCTestCase {
    func testPatternComponentMetrics() {
        XCTAssertEqual(DSComponentMetrics.weekCellRadius, 14)
        XCTAssertEqual(DSComponentMetrics.loadDotSize, 4)
        XCTAssertEqual(DSComponentMetrics.countPillHeight, 36)
        XCTAssertEqual(DSComponentMetrics.presetTileHeight, 64)
        XCTAssertEqual(DSComponentMetrics.markToggleSize, 48)
        XCTAssertEqual(DSComponentMetrics.podiumHeights, [120, 150, 104])
    }

    func testWeekStripDayEquality() {
        let a = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        let b = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        XCTAssertEqual(a, b)
    }
}

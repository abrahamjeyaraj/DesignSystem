import XCTest
@testable import DesignSystem

final class DSComponentsTests: XCTestCase {
    func testPenV2MetricsMatchPenSpec() {
        XCTAssertEqual(DSPenV2Metrics.weekCellRadius, 14)
        XCTAssertEqual(DSPenV2Metrics.loadDotSize, 4)
        XCTAssertEqual(DSPenV2Metrics.countPillHeight, 36)
        XCTAssertEqual(DSPenV2Metrics.presetTileHeight, 64)
        XCTAssertEqual(DSPenV2Metrics.markToggleSize, 48)
        XCTAssertEqual(DSPenV2Metrics.podiumHeights, [120, 150, 104])
    }

    func testWeekStripDayEquality() {
        let a = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        let b = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        XCTAssertEqual(a, b)
    }
}

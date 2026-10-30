import XCTest
@testable import DesignSystem

final class DSComponentsTests: XCTestCase {
    func testPatternComponentMetrics() {
        XCTAssertEqual(DSComponentMetrics.weekCellRadius, 12)
        XCTAssertEqual(DSComponentMetrics.loadDotSize, 4)
        XCTAssertEqual(DSComponentMetrics.countPillHeight, 36)
        XCTAssertEqual(DSComponentMetrics.presetTileHeight, 64)
        XCTAssertEqual(DSComponentMetrics.markToggleSize, 48)
        XCTAssertEqual(DSComponentMetrics.podiumHeights, [120, 150, 104])
        XCTAssertEqual(DSComponentMetrics.buttonHeight, 52)
        XCTAssertEqual(DSComponentMetrics.buttonLabelSize, 15)
        XCTAssertEqual(DSComponentMetrics.buttonHPadding, 16)
        XCTAssertEqual(DSComponentMetrics.cardPadding, 18)
        XCTAssertEqual(DSComponentMetrics.cardRadius, 16)
        XCTAssertEqual(DSComponentMetrics.controlRadius, 14)
        XCTAssertEqual(DSComponentMetrics.fieldHeight, 44)
        XCTAssertEqual(DSComponentMetrics.fieldHPadding, 14)
        XCTAssertEqual(DSComponentMetrics.fieldLabelSize, 13)
        XCTAssertEqual(DSComponentMetrics.fieldInputSize, 15)
        XCTAssertEqual(DSComponentMetrics.weekCellTopPadding, 9)
        XCTAssertEqual(DSComponentMetrics.weekCellBottomPadding, 7)
        XCTAssertEqual(DSComponentMetrics.weekDayNameSize, 9)
        XCTAssertEqual(DSComponentMetrics.weekDayNumberSize, 15)
    }

    func testWeekStripDayEquality() {
        let a = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        let b = DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4)
        XCTAssertEqual(a, b)
    }
}

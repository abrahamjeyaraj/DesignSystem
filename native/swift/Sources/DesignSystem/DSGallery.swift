#if canImport(SwiftUI)
import SwiftUI

/// A manual visual catalog of every DesignSystem component for a selected app theme.
public struct DSGallery: View {
    public let theme: DSThemeTokens
    public let previewScheme: ColorScheme?
    @State private var selectedSegment = "All"
    @State private var selectedTab = "Today"
    @State private var searchText = ""
    @State private var fieldText = "₹12,000"
    @State private var notesText = "Great progress this week."
    @State private var markOn = true
    @State private var stepperValue = 3
    @State private var selectedPreset = "5"
    @State private var selectedWeekDay = "fri"

    public init(theme: DSThemeTokens = DSTokens.tuition, colorScheme: ColorScheme? = nil) {
        self.theme = theme
        self.previewScheme = colorScheme
    }

    public var body: some View {
        let colors = theme.colors(for: previewScheme ?? .light)
        ScrollView {
            VStack(alignment: .leading, spacing: theme.mobileLayout.sectionGap) {
                DSStatusBar()
                DSLargeTitle(eyebrow: "DESIGN SYSTEM · \(theme.name.uppercased())", title: "Component gallery") {
                    DSIconButton(systemImage: "bell", accessibilityLabel: "Notifications") {}
                }
                DSSectionHeader("Buttons") { Text("Primary · Secondary · Ghost · Destructive").dsFont(.caption).foregroundStyle(Color(dsHex: colors.inkMuted)) }
                VStack(spacing: theme.mobileLayout.itemGap) {
                    DSButton("Record payment", leadingSystemImage: "plus") {}
                    DSButton("Remind", variant: .secondary, leadingSystemImage: "bell") {}
                    DSButton("View details", variant: .ghost) {}
                    DSButton("Delete", variant: .destructive, leadingSystemImage: "trash") {}
                    HStack { DSIconButton(systemImage: "ellipsis", accessibilityLabel: "More actions") {}; DSAvatar(initials: "AR", accessibilityLabel: "Alex Morgan"); DSChip("Group A"); DSChip("Active", tone: .accent); DSChip("Paid", tone: .success); DSChip("Due", tone: .warning); DSChip("Overdue", tone: .error) }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Typography")
                VStack(alignment: .leading, spacing: 8) {
                    Text("Title · Today").dsFont(.title)
                    Text("Headline · Classes today").dsFont(.headline)
                    Text("Body · Alex Morgan").dsFont(.body)
                    Text("Label · Group A · Design").dsFont(.label)
                    Text("Caption · Updated just now").dsFont(.caption)
                }.foregroundStyle(Color(dsHex: colors.foreground)).padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("List row")
                DSListRow(title: "Alex Morgan", subtitle: "Group A · Design, Research", showsChevron: true, action: {}) {
                    DSAvatar(initials: "AR")
                } trailing: { DSChip("Due", tone: .warning) }
                DSSectionHeader("Stat tile")
                HStack {
                    DSStatTile(label: "Collected", value: "₹3,84,000", meta: "+12% vs Aug", tone: .success)
                    DSStatTile(label: "Pending", value: "₹42,000", meta: "8 invoices", tone: .warning)
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Segmented control")
                DSSegmentedControl(options: ["All", "Due", "Overdue", "Paid"], selection: $selectedSegment, title: { $0 }).padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Fields")
                VStack(spacing: theme.mobileLayout.itemGap) {
                    DSField(label: "Amount") { TextField("Amount", text: $fieldText) }
                    DSSearchField(text: $searchText, placeholder: "Search items")
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Navigation")
                DSNavBar(title: "Details") {
                    DSIconButton(systemImage: "chevron.left", accessibilityLabel: "Back") {}
                } trailing: {
                    DSIconButton(systemImage: "ellipsis", accessibilityLabel: "More options") {}
                }.background(Color(dsHex: colors.card))
                DSSheetHandle()
                DSSectionHeader("Card")
                DSCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Profile").dsFont(.headline)
                        Text("DSCard provides a themed surface, border, and card radius.").dsFont(.body)
                        DSChip("Active", tone: .success)
                    }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Tab bar")
                DSTabBar(items: [
                    DSTabItem("Today", systemImage: "sun.max"), DSTabItem("People", systemImage: "person.2"),
                    DSTabItem("Payments", systemImage: "indianrupeesign.circle"), DSTabItem("Library", systemImage: "book.closed"),
                    DSTabItem("More", systemImage: "ellipsis")
                ], selection: $selectedTab).padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Toggle · Progress · Ink card · Nudge")
                HStack { DSToggle(isOn: .constant(true), accessibilityLabel: "Notifications on"); DSToggle(isOn: .constant(false), accessibilityLabel: "Notifications off") }
                DSProgress(value: 0.72, label: "Recent tests", valueLabel: "72%", tone: .accent2).padding(.horizontal, theme.mobileLayout.gutter)
                DSInkCard { VStack(alignment: .leading, spacing: 8) { Text("Up next").foregroundStyle(Color(dsHex: colors.onInkAccent)); Text("Evening session"); Text("Workshop · 8 people").foregroundStyle(Color(dsHex: colors.onInkMuted)) } }.padding(.horizontal, theme.mobileLayout.gutter)
                DSNudge(title: "Reminders ready", subtitle: "3 people to follow up", systemImage: "bell.badge", action: {})
                DSSectionHeader("Empty state")
                DSEmptyState(systemImage: "tray", title: "No payments due", message: "New payment reminders will appear here.") {
                    DSButton("Add payment", leadingSystemImage: "plus") {}
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Patterns · Snackbar")
                DSSnackbarBar(message: "Item added", action: DSSnackbarAction(title: "Undo", handler: {}))
                    .padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Week strip · Timeline")
                DSWeekStrip(
                    days: [
                        DSWeekStripDay(id: "mon", weekdaySymbol: "M", dayNumber: 15, loadCount: 3),
                        DSWeekStripDay(id: "fri", weekdaySymbol: "F", dayNumber: 19, loadCount: 4),
                        DSWeekStripDay(id: "sat", weekdaySymbol: "S", dayNumber: 20, loadCount: 1),
                    ],
                    selectedDayID: selectedWeekDay,
                    todayDayID: "fri",
                    onSelect: { selectedWeekDay = $0.id }
                ).padding(.horizontal, theme.mobileLayout.gutter)
                DSTimelineRow(timeStart: "09:30", timeEnd: "10:30", state: .live) {
                    Text("Morning session").dsFont(.headline)
                } footer: {
                    DSChip("Live", tone: .accent)
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Count pill · Podium · Mark")
                HStack {
                    DSCountPill(symbol: "#", count: 42, action: {})
                    DSMarkToggle(isMarked: $markOn, accessibilityLabel: "Mark toggle")
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSPodium(entries: [
                    DSPodiumEntry(id: "2", name: "Alex", value: "42 pts · #2", columnHeight: 120),
                    DSPodiumEntry(id: "1", name: "Jordan", value: "51 pts · #1", columnHeight: 150, isLeader: true),
                    DSPodiumEntry(id: "3", name: "Sam", value: "38 pts · #3", columnHeight: 104),
                ]) { entry in DSAvatar(initials: String(entry.name.prefix(2))) }
                    .padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Summary · Presets · Quick actions")
                DSSummaryBar(items: [
                    DSSummaryItem(label: "Done", value: "7", tone: .success),
                    DSSummaryItem(label: "Pending", value: "1", tone: .error),
                    DSSummaryItem(label: "Average", value: "92%"),
                ]).padding(.horizontal, theme.mobileLayout.gutter)
                DSPresetGrid(
                    options: [DSPresetOption(id: "1", label: "+1"), DSPresetOption(id: "5", label: "+5"), DSPresetOption(id: "10", label: "+10")],
                    selectedID: selectedPreset,
                    onSelect: { selectedPreset = $0.id }
                ).padding(.horizontal, theme.mobileLayout.gutter)
                DSStepper(value: $stepperValue, in: 1...99).padding(.horizontal, theme.mobileLayout.gutter)
                HStack {
                    DSQuickActionTile(title: "Call", systemImage: "phone", action: {})
                    DSQuickActionTile(title: "History", systemImage: "clock", action: {})
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Activity · Notes")
                DSActivityRow(title: "Record updated", detail: "Entry saved", timestamp: "16:52", systemImage: "clock", actionTitle: "Undo", onAction: {})
                DSMultilineField(label: "Notes", text: $notesText, maxLength: 500)
                    .padding(.horizontal, theme.mobileLayout.gutter)
            }
            .padding(.vertical, theme.mobileLayout.gutter)
        }
        .background(Color(dsHex: colors.background).ignoresSafeArea())
        .foregroundStyle(Color(dsHex: colors.foreground))
        .dsTheme(theme)
        .preferredColorScheme(previewScheme)
    }
}

#Preview("Tuition · Light") { DSGallery(theme: DSTokens.tuition, colorScheme: .light) }
#Preview("Tuition · Dark") { DSGallery(theme: DSTokens.tuition, colorScheme: .dark) }
#Preview("Church · Light") { DSGallery(theme: DSTokens.church, colorScheme: .light) }
#Preview("Church · Dark") { DSGallery(theme: DSTokens.church, colorScheme: .dark) }
#Preview("Bible · Light") { DSGallery(theme: DSTokens.bible, colorScheme: .light) }
#Preview("Bible · Dark") { DSGallery(theme: DSTokens.bible, colorScheme: .dark) }
#endif

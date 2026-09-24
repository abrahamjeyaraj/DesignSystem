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
                    HStack { DSIconButton(systemImage: "ellipsis", accessibilityLabel: "More actions") {}; DSAvatar(initials: "AR", accessibilityLabel: "Ananya Raghavan"); DSChip("Class 10"); DSChip("Active", tone: .accent); DSChip("Paid", tone: .success); DSChip("Due", tone: .warning); DSChip("Overdue", tone: .error) }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Typography")
                VStack(alignment: .leading, spacing: 8) {
                    Text("Title · Today").dsFont(.title)
                    Text("Headline · Classes today").dsFont(.headline)
                    Text("Body · Ananya Raghavan").dsFont(.body)
                    Text("Label · Class 10 · Maths").dsFont(.label)
                    Text("Caption · Updated just now").dsFont(.caption)
                }.foregroundStyle(Color(dsHex: colors.foreground)).padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("List row")
                DSListRow(title: "Ananya Raghavan", subtitle: "Class 10 · Maths, Physics", showsChevron: true, action: {}) {
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
                    DSSearchField(text: $searchText, placeholder: "Search students")
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Navigation")
                DSNavBar(title: "Student") {
                    DSIconButton(systemImage: "chevron.left", accessibilityLabel: "Back") {}
                } trailing: {
                    DSIconButton(systemImage: "ellipsis", accessibilityLabel: "More options") {}
                }.background(Color(dsHex: colors.card))
                DSSheetHandle()
                DSSectionHeader("Card")
                DSCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Student profile").dsFont(.headline)
                        Text("DSCard provides a themed surface, border, and card radius.").dsFont(.body)
                        DSChip("Active", tone: .success)
                    }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Tab bar")
                DSTabBar(items: [
                    DSTabItem("Today", systemImage: "sun.max"), DSTabItem("Students", systemImage: "person.2"),
                    DSTabItem("Fees", systemImage: "indianrupeesign.circle"), DSTabItem("Classes", systemImage: "book.closed"),
                    DSTabItem("More", systemImage: "ellipsis")
                ], selection: $selectedTab).padding(.horizontal, theme.mobileLayout.gutter)
                DSSectionHeader("Empty state")
                DSEmptyState(systemImage: "tray", title: "No payments due", message: "New payment reminders will appear here.") {
                    DSButton("Add payment", leadingSystemImage: "plus") {}
                }.padding(.horizontal, theme.mobileLayout.gutter)
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

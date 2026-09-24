#if canImport(SwiftUI)
import SwiftUI

/// A manual visual catalog of every AbeDesign component for a selected app theme.
public struct AbeGallery: View {
    public let theme: AbeThemeTokens
    public let previewScheme: ColorScheme?
    @State private var selectedSegment = "All"
    @State private var selectedTab = "Today"
    @State private var searchText = ""
    @State private var fieldText = "₹12,000"

    public init(theme: AbeThemeTokens = AbeTokens.tuition, colorScheme: ColorScheme? = nil) {
        self.theme = theme
        self.previewScheme = colorScheme
    }

    public var body: some View {
        let colors = theme.colors(for: previewScheme ?? .light)
        ScrollView {
            VStack(alignment: .leading, spacing: theme.mobileLayout.sectionGap) {
                AbeStatusBar()
                AbeLargeTitle(eyebrow: "ABE DESIGN · \(theme.name.uppercased())", title: "Component gallery") {
                    AbeIconButton(systemImage: "bell", accessibilityLabel: "Notifications") {}
                }
                AbeSectionHeader("Buttons") { Text("Primary · Secondary · Ghost · Destructive").abeFont(.caption).foregroundStyle(Color(abeHex: colors.inkMuted)) }
                VStack(spacing: theme.mobileLayout.itemGap) {
                    AbeButton("Record payment", leadingSystemImage: "plus") {}
                    AbeButton("Remind", variant: .secondary, leadingSystemImage: "bell") {}
                    AbeButton("View details", variant: .ghost) {}
                    AbeButton("Delete", variant: .destructive, leadingSystemImage: "trash") {}
                    HStack { AbeIconButton(systemImage: "ellipsis", accessibilityLabel: "More actions") {}; AbeAvatar(initials: "AR", accessibilityLabel: "Ananya Raghavan"); AbeChip("Class 10"); AbeChip("Active", tone: .accent); AbeChip("Paid", tone: .success); AbeChip("Due", tone: .warning); AbeChip("Overdue", tone: .error) }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Typography")
                VStack(alignment: .leading, spacing: 8) {
                    Text("Title · Today").abeFont(.title)
                    Text("Headline · Classes today").abeFont(.headline)
                    Text("Body · Ananya Raghavan").abeFont(.body)
                    Text("Label · Class 10 · Maths").abeFont(.label)
                    Text("Caption · Updated just now").abeFont(.caption)
                }.foregroundStyle(Color(abeHex: colors.foreground)).padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("List row")
                AbeListRow(title: "Ananya Raghavan", subtitle: "Class 10 · Maths, Physics", showsChevron: true, action: {}) {
                    AbeAvatar(initials: "AR")
                } trailing: { AbeChip("Due", tone: .warning) }
                AbeSectionHeader("Stat tile")
                HStack {
                    AbeStatTile(label: "Collected", value: "₹3,84,000", meta: "+12% vs Aug", tone: .success)
                    AbeStatTile(label: "Pending", value: "₹42,000", meta: "8 invoices", tone: .warning)
                }.padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Segmented control")
                AbeSegmentedControl(options: ["All", "Due", "Overdue", "Paid"], selection: $selectedSegment, title: { $0 }).padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Fields")
                VStack(spacing: theme.mobileLayout.itemGap) {
                    AbeField(label: "Amount") { TextField("Amount", text: $fieldText) }
                    AbeSearchField(text: $searchText, placeholder: "Search students")
                }.padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Navigation")
                AbeNavBar(title: "Student") {
                    AbeIconButton(systemImage: "chevron.left", accessibilityLabel: "Back") {}
                } trailing: {
                    AbeIconButton(systemImage: "ellipsis", accessibilityLabel: "More options") {}
                }.background(Color(abeHex: colors.card))
                AbeSheetHandle()
                AbeSectionHeader("Card")
                AbeCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Student profile").abeFont(.headline)
                        Text("AbeCard provides a themed surface, border, and card radius.").abeFont(.body)
                        AbeChip("Active", tone: .success)
                    }
                }.padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Tab bar")
                AbeTabBar(items: [
                    AbeTabItem("Today", systemImage: "sun.max"), AbeTabItem("Students", systemImage: "person.2"),
                    AbeTabItem("Fees", systemImage: "indianrupeesign.circle"), AbeTabItem("Classes", systemImage: "book.closed"),
                    AbeTabItem("More", systemImage: "ellipsis")
                ], selection: $selectedTab).padding(.horizontal, theme.mobileLayout.gutter)
                AbeSectionHeader("Empty state")
                AbeEmptyState(systemImage: "tray", title: "No payments due", message: "New payment reminders will appear here.") {
                    AbeButton("Add payment", leadingSystemImage: "plus") {}
                }.padding(.horizontal, theme.mobileLayout.gutter)
            }
            .padding(.vertical, theme.mobileLayout.gutter)
        }
        .background(Color(abeHex: colors.background).ignoresSafeArea())
        .foregroundStyle(Color(abeHex: colors.foreground))
        .abeTheme(theme)
        .preferredColorScheme(previewScheme)
    }
}

#Preview("Tuition · Light") { AbeGallery(theme: AbeTokens.tuition, colorScheme: .light) }
#Preview("Tuition · Dark") { AbeGallery(theme: AbeTokens.tuition, colorScheme: .dark) }
#Preview("Church · Light") { AbeGallery(theme: AbeTokens.church, colorScheme: .light) }
#Preview("Church · Dark") { AbeGallery(theme: AbeTokens.church, colorScheme: .dark) }
#Preview("Bible · Light") { AbeGallery(theme: AbeTokens.bible, colorScheme: .light) }
#Preview("Bible · Dark") { AbeGallery(theme: AbeTokens.bible, colorScheme: .dark) }
#endif

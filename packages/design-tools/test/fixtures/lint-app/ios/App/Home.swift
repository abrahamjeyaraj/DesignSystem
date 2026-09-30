import SwiftUI
struct Home: View {
    var body: some View {
        Label("Home", systemImage: "house")
        Image(systemName: "gear").foregroundStyle(Color(hex: "#1A1A1A"))
        DSIcon(.home)
    }
}

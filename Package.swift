// swift-tools-version:5.9
// Root manifest so apps can add this repo as a Swift package by git URL + version tag.
import PackageDescription

let package = Package(
    name: "DesignSystem",
    platforms: [.iOS(.v16), .macOS(.v13), .tvOS(.v16), .watchOS(.v9)],
    products: [.library(name: "DesignSystem", targets: ["DesignSystem"])],
    targets: [
        .target(name: "DesignSystem", path: "native/swift/Sources/DesignSystem"),
        .testTarget(name: "DesignSystemTests", dependencies: ["DesignSystem"], path: "native/swift/Tests/DesignSystemTests"),
    ]
)

// swift-tools-version:5.9
// Root manifest so apps can add this repo as a Swift package by git URL + version tag.
import PackageDescription

let package = Package(
    name: "AbeDesign",
    platforms: [.iOS(.v16), .macOS(.v13), .tvOS(.v16), .watchOS(.v9)],
    products: [.library(name: "AbeDesign", targets: ["AbeDesign"])],
    targets: [
        .target(name: "AbeDesign", path: "native/swift/Sources/AbeDesign"),
        .testTarget(name: "AbeDesignTests", dependencies: ["AbeDesign"], path: "native/swift/Tests/AbeDesignTests"),
    ]
)

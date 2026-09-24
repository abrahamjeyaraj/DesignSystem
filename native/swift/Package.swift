// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "AbeDesign",
    platforms: [.iOS(.v16), .macOS(.v13), .tvOS(.v16), .watchOS(.v9)],
    products: [.library(name: "AbeDesign", targets: ["AbeDesign"])],
    targets: [
        .target(name: "AbeDesign"),
        .testTarget(name: "AbeDesignTests", dependencies: ["AbeDesign"]),
    ]
)

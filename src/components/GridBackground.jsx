import React from 'react';

export default function GridBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Base Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(187,164,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(187,164,115,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Brighter Major Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(187,164,115,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(187,164,115,0.07)_1px,transparent_1px)] bg-[size:200px_200px]"></div>

            {/* Radial Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(187,164,115,0.15),transparent_70%)]"></div>

            {/* Animated Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#BBA473] rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8E7D5A] rounded-full mix-blend-screen filter blur-[128px] opacity-5 animate-pulse" style={{ animationDuration: '7s' }}></div>
        </div>
    );
}

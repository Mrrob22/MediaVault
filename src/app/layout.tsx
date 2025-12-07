import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
    title: "Resumable Media Vault",
    description: "Direct-to-S3 media uploads with Next.js App Router",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    <header className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Resumable Media Vault
                        </h1>
                        <span className="text-xs text-slate-400">
                            Next.js · TypeScript · S3 Direct Upload
                        </span>
                    </header>
                    {children}
                </div>
            </body>
        </html>
    );
}

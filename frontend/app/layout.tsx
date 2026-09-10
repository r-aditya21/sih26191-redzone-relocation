import "./globals.css"; import type {Metadata} from "next";
import { AuthProvider } from "../lib/AuthContext";
export const metadata:Metadata={title:"RakshaGrid | SIH 26191",description:"Proactive disaster relocation planning command center"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>}
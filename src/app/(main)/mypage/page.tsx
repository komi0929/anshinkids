import { getFullMyPageData } from "@/app/actions/mypage";
import MyPageClient from "./mypage-client";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const dynamic = 'force-dynamic';

export default function MyPage() {
 // By passing null initialData and avoiding server-side promises,
 // Next.js App Router executes an instant soft navigation (0ms TTFB).
 return <MyPageClient initialData={null} />;
}

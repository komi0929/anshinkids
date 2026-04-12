import { getFullMyPageData } from "@/app/actions/mypage";
import MyPageClient from "./mypage-client";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const dynamic = 'force-dynamic';

async function MyPageFetcher() {
  const result = await getFullMyPageData();
  return <MyPageClient initialData={result} />;
}

export default function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MyPageFetcher />
    </Suspense>
  );
}

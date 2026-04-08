import { getFullMyPageData } from "@/app/actions/mypage";
import MyPageClient from "./mypage-client";

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const result = await getFullMyPageData();
  return <MyPageClient initialData={result} />;
}

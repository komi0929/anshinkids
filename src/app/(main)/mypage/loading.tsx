export default function MyPageLoading() {
  return (
    <div className="fade-in px-5 pt-8 w-full max-w-2xl mx-auto">
      <div className="shimmer h-24 w-full rounded-2xl mb-8"></div>
      <div className="shimmer h-12 w-48 rounded-xl mb-4"></div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="shimmer h-24 rounded-2xl"></div>
        <div className="shimmer h-24 rounded-2xl"></div>
      </div>
      <div className="shimmer h-32 w-full rounded-2xl mb-6"></div>
      <div className="shimmer h-32 w-full rounded-2xl mb-6"></div>
    </div>
  );
}

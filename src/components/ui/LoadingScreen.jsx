export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-[#e2e8f0] border-t-primary-500 rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-[#475569]">Loading</p>
          <p className="text-xs text-[#94a3b8]">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <div className="card-body flex flex-col items-center gap-5 py-10 text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-primary-500 to-[#6f5dff] shadow-[0_20px_40px_rgba(43,99,246,0.22)] flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-white">N</span>
            </div>
            <div className="absolute -inset-2 rounded-[28px] border border-primary-200/60 animate-pulse" />
          </div>
          <div className="w-10 h-10 border-[3px] border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          <div className="space-y-1">
            <p className="font-display text-xl text-[#10203f]">Preparing your workspace</p>
            <p className="text-sm text-[#5d6d8f]">Loading the latest forms, submissions, and analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-xl mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TODO 재능 교환 플랫폼</h1>
          <p className="text-slate-500 mt-2">서로의 재능을 교환하는 놀라운 경험</p>
        </div>
        {children}
      </div>
    </div>
  );
}

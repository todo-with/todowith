import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="ToDoWith Logo"
            width={180}
            height={80}
            className="h-20 w-auto object-contain mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ToDoWith</h1>
          <p className="text-slate-500 mt-2 font-medium">나와 메이트를 위한 완벽한 재능 교환 플랫폼</p>
        </div>
        {children}
      </div>
    </div>
  );
}

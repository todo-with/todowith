import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg mt-[-5vh]">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="ToDoWith Logo"
            width={600}
            height={320}
            className="h-80 w-auto object-contain mb-0 hover:scale-105 transition-transform duration-700 ease-in-out cursor-default"
            priority
          />
          <p className="text-slate-600 font-semibold text-xl tracking-wide">나와 메이트를 위한 완벽한 재능 교환 플랫폼</p>
        </div>
        {children}
      </div>
    </div>
  );
}

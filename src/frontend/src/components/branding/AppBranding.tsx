export default function AppBranding() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img 
        src="/assets/generated/app-icon.dim_512x512.png" 
        alt="Push Sports Event Manager" 
        className="h-20 w-20 rounded-2xl shadow-lg"
      />
      <h1 className="text-xl font-bold">Push Sports Event Manager</h1>
    </div>
  );
}

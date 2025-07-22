import PPLogo from '@/components/ui/Navbar/pplogo';

export default function Navbar() {
  return (
    <div className="grid grid-flow-col justify-items-center my-4">
      <div className="flex items-center space-x-2">
        <PPLogo />
        <h1 className="font-sans text-2xl font-semibold">Parse & Plate</h1>
      </div>
    </div>
  );
}
